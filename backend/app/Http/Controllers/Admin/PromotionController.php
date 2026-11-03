<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PromotionHistory;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PromotionController extends Controller
{
    /**
     * Legacy 1-Click bulk promotion: move ALL students from one class to another.
     * Retained for backward compatibility with the existing ClassPromotion UI.
     */
    public function promote(Request $request)
    {
        $validated = $request->validate([
            'from_class_id' => 'required|exists:classes,id',
            'to_class_id' => 'required|exists:classes,id|different:from_class_id',
        ]);

        $fromClass = SchoolClass::findOrFail($validated['from_class_id']);
        $toClass = SchoolClass::findOrFail($validated['to_class_id']);

        DB::transaction(function () use ($fromClass, $toClass) {
            Student::where('class_id', $fromClass->id)->update([
                'class_id' => $toClass->id
            ]);
        });

        $count = Student::where('class_id', $toClass->id)->count();

        return response()->json([
            'message' => "Successfully promoted students from {$fromClass->name} {$fromClass->arm} to {$toClass->name} {$toClass->arm}.",
            'promoted_count' => $count
        ], 200);
    }

    /**
     * Granular per-student promotion with history tracking and audit trail.
     *
     * Accepts a list of student records, each with an individual status
     * ('promoted', 'repeated', 'graduated'), updates the student's class,
     * and creates a PromotionHistory record for each transition.
     *
     * Request body:
     *  - from_class_id      : int  (the source class)
     *  - to_class_id        : int  (the destination class for promoted students)
     *  - result_window_id   : int  (the session/term window for this promotion batch)
     *  - students            : array of { student_id, status }
     */
    public function promoteClass(Request $request)
    {
        $validated = $request->validate([
            'from_class_id'    => 'required|exists:classes,id',
            'to_class_id'      => 'required|exists:classes,id',
            'result_window_id' => 'required|exists:result_windows,id',
            'students'         => 'required|array|min:1',
            'students.*.student_id' => 'required|exists:students,id',
            'students.*.status'     => 'required|string|in:promoted,repeated,graduated',
        ]);

        $fromClass = SchoolClass::findOrFail($validated['from_class_id']);
        $toClass   = SchoolClass::findOrFail($validated['to_class_id']);

        $summary = ['promoted' => 0, 'repeated' => 0, 'graduated' => 0];

        // Eager load all target students to eliminate N+1 database queries in loop
        $studentIds = collect($validated['students'])->pluck('student_id');
        $studentsMap = Student::whereIn('id', $studentIds)->get()->keyBy('id');

        DB::transaction(function () use ($validated, $fromClass, $toClass, $studentsMap, &$summary) {
            foreach ($validated['students'] as $entry) {
                $studentId = $entry['student_id'];
                $status    = $entry['status'];
                $student   = $studentsMap->get($studentId);
                if (!$student) {
                    continue;
                }

                // Determine the destination class based on transition status
                switch ($status) {
                    case 'promoted':
                        // Move student to the next class
                        $student->update(['class_id' => $toClass->id]);
                        $destinationClassId = $toClass->id;
                        break;

                    case 'repeated':
                        // Student stays in the same class — no class_id change
                        $destinationClassId = $fromClass->id;
                        break;

                    case 'graduated':
                        // Student has completed the school — clear their class assignment
                        $student->update(['class_id' => null]);
                        $destinationClassId = null;
                        break;

                    default:
                        $destinationClassId = $toClass->id;
                }

                // Record the transition in the promotion_histories table
                $history = PromotionHistory::create([
                    'student_id'       => $studentId,
                    'from_class_id'    => $fromClass->id,
                    'to_class_id'      => $destinationClassId,
                    'result_window_id' => $validated['result_window_id'],
                    'status'           => $status,
                ]);

                // Audit trail: log the individual student transition
                AuditService::log(
                    'student_promoted',
                    "Student {$student->name} (Adm: {$student->admission_number}) transitioned with status '{$status}' from {$fromClass->name} {$fromClass->arm}.",
                    $history
                );

                $summary[$status]++;
            }
        });

        $total = array_sum($summary);

        return response()->json([
            'message' => "Class promotion completed: {$total} student(s) processed.",
            'summary' => $summary,
        ], 200);
    }
}
