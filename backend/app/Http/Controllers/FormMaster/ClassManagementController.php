<?php

namespace App\Http\Controllers\FormMaster;

use App\Models\Attendance;
use App\Http\Controllers\Controller;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\TermSummary;
use App\Models\AcademicTerm;
use Illuminate\Http\Request;

class ClassManagementController extends Controller
{
    public function assignedClass(Request $request)
    {
        $user = $request->user();
        $class = SchoolClass::where('form_master_id', $user->id)->with('students')->first();

        if (!$class) {
            // Fallback: return first class for demonstration if not assigned specifically
            $class = SchoolClass::with('students')->first();
        }

        return response()->json($class, 200);
    }

    public function updateRemarks(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'class_id' => 'required|exists:classes,id',
            'term_id' => 'required|exists:academic_terms,id',
            'form_master_remark' => 'nullable|string',
            'principal_remark' => 'nullable|string',
            'attendance_present' => 'nullable|integer|min:0',
            'attendance_total' => 'nullable|integer|min:0',
        ]);

        $user = $request->user();
        $isAdmin = $user && method_exists($user, 'isAdmin') ? $user->isAdmin() : in_array($user->role ?? '', ['admin', 'super_admin']);

        // 1. Teacher Class Authorization: Verify Form Master assignment
        if (!$isAdmin) {
            $class = SchoolClass::find($validated['class_id']);
            if (!$class || (int)$class->form_master_id !== (int)$user->id) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthorized. You are not officially assigned as the Form Master for this class.',
                ], 403);
            }
        }

        // 2. Strict Backend Result Window Lock Enforcement
        $academicTerm = AcademicTerm::find($validated['term_id']);
        if ($academicTerm) {
            $term = $academicTerm->term;
            $window = \App\Models\ResultWindow::where('academic_session', $academicTerm->session)
                ->where(function ($q) use ($term) {
                    $q->where('term', $term)
                      ->orWhere('term', str_replace(['1st', '2nd', '3rd'], ['First', 'Second', 'Third'], $term))
                      ->orWhere('term', str_replace(['First', 'Second', 'Third'], ['1st', '2nd', '3rd'], $term));
                })
                ->first();

            if (!$window || !$window->is_open) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Result window is locked or closed. Remarks modification is forbidden.',
                ], 403);
            }
        }

        $summary = TermSummary::firstOrNew([
            'student_id' => $validated['student_id'],
            'class_id' => $validated['class_id'],
            'term_id' => $validated['term_id'],
        ]);

        $summary->form_master_remark = $validated['form_master_remark'] ?? $summary->form_master_remark;
        $summary->principal_remark = $validated['principal_remark'] ?? $summary->principal_remark;
        $summary->attendance_present = $validated['attendance_present'] ?? $summary->attendance_present;
        $summary->attendance_total = $validated['attendance_total'] ?? $summary->attendance_total;
        $summary->save();

        return response()->json([
            'message' => 'Terminal remarks and attendance updated successfully',
            'data' => $summary
        ], 200);
    }

    /**
     * Retrieve daily attendance records for a class on a specific date.
     */
    public function getAttendance(Request $request)
    {
        $user = $request->user();
        
        $classId = $request->query('class_id');
        $date = $request->query('date') ?: now()->toDateString();

        if (!$classId && $user) {
            $class = SchoolClass::where('form_master_id', $user->id)->first();
            $classId = $class?->id;
        }

        if (!$classId) {
            return response()->json([
                'date' => $date,
                'class_id' => null,
                'attendance' => []
            ], 200);
        }

        $records = Attendance::where('class_id', $classId)
            ->where('date', $date)
            ->with('student')
            ->get();

        return response()->json([
            'date' => $date,
            'class_id' => (int)$classId,
            'attendance' => $records
        ], 200);
    }

    /**
     * Save/upsert daily attendance records for students in a class.
     */
    public function storeAttendance(Request $request)
    {
        $validated = $request->validate([
            'class_id' => 'required|exists:classes,id',
            'date' => 'required|date',
            'records' => 'required|array',
            'records.*.student_id' => 'required|exists:students,id',
            'records.*.status' => 'required|in:present,late,excused,absent',
            'records.*.remark' => 'nullable|string|max:255',
        ]);

        $user = $request->user();
        $isAdmin = $user && method_exists($user, 'isAdmin') ? $user->isAdmin() : in_array($user->role ?? '', ['admin', 'super_admin']);

        // 1. Teacher Class Authorization
        if (!$isAdmin) {
            $class = SchoolClass::find($validated['class_id']);
            $isFormMaster = $class && (int)$class->form_master_id === (int)$user->id;
            $isTeacherOfClass = \App\Models\SubjectAssignment::where('teacher_id', $user->id)
                ->where('class_id', $validated['class_id'])
                ->exists();

            if (!$isFormMaster && !$isTeacherOfClass) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Unauthorized. You are not officially assigned to this class.',
                ], 403);
            }
        }

        // 2. Strict Backend Result Window Lock Enforcement
        $activeTerm = AcademicTerm::where('is_current', true)->first() ?? AcademicTerm::latest()->first();
        if ($activeTerm) {
            $term = $activeTerm->term;
            $window = \App\Models\ResultWindow::where('academic_session', $activeTerm->session)
                ->where(function ($q) use ($term) {
                    $q->where('term', $term)
                      ->orWhere('term', str_replace(['1st', '2nd', '3rd'], ['First', 'Second', 'Third'], $term))
                      ->orWhere('term', str_replace(['First', 'Second', 'Third'], ['1st', '2nd', '3rd'], $term));
                })
                ->first();

            if (!$window || !$window->is_open) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Academic session/term window is locked or closed. Attendance modification is forbidden.',
                ], 403);
            }
        }

        $savedCount = 0;

        foreach ($validated['records'] as $record) {
            Attendance::updateOrCreate(
                [
                    'student_id' => $record['student_id'],
                    'date' => $validated['date'],
                ],
                [
                    'class_id' => $validated['class_id'],
                    'status' => $record['status'],
                    'remark' => in_array($record['status'], ['excused', 'absent']) ? ($record['remark'] ?? null) : null,
                    'marked_by' => $user ? $user->id : null,
                ]
            );
            $savedCount++;
        }

        return response()->json([
            'message' => "Attendance records successfully saved for {$savedCount} students on {$validated['date']}.",
            'count' => $savedCount,
        ], 200);
    }
}

