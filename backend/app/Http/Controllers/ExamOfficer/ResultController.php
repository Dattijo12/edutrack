<?php

namespace App\Http\Controllers\ExamOfficer;

use App\Http\Controllers\Controller;
use App\Models\Result;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\SchoolSetting;
use App\Models\AcademicTerm;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ResultController extends Controller
{
    /**
     * List all results awaiting approval, with optional class_id and subject_id filtering.
     */
    public function pending(Request $request)
    {
        return $this->getPendingResults($request);
    }

    /**
     * Get pending results with optional class_id and subject_id query filtering.
     */
    public function getPendingResults(Request $request)
    {
        $query = Result::where(function ($q) {
            $q->where('approval_status', 'pending')
              ->orWhere('status', 'pending');
        });

        if ($request->has('class_id') && !empty($request->query('class_id'))) {
            $classId = $request->query('class_id');
            $query->where(function ($q) use ($classId) {
                $q->where('class_id', $classId)
                  ->orWhereHas('student', function ($sq) use ($classId) {
                      $sq->where('class_id', $classId);
                  });
            });
        }

        if ($request->has('subject_id') && !empty($request->query('subject_id'))) {
            $query->where('subject_id', $request->query('subject_id'));
        }

        $results = $query->with(['student.class', 'subject', 'teacher', 'schoolClass'])->get();

        return response()->json($results, 200);
    }

    /**
     * Bulk approve results using result_ids array.
     */
    public function bulkApprove(Request $request)
    {
        $validated = $request->validate([
            'result_ids' => 'required|array',
            'result_ids.*' => 'required|integer|exists:results,id',
        ]);

        DB::transaction(function () use ($validated) {
            Result::whereIn('id', $validated['result_ids'])->update([
                'status' => 'approved',
                'approval_status' => 'approved',
                'rejection_reason' => null,
            ]);
        });

        return response()->json([
            'message' => 'Results approved successfully.',
            'approved_count' => count($validated['result_ids']),
        ], 200);
    }

    /**
     * Approve a specific result record.
     * Sets both status and approval_status to 'approved' and clears any previous rejection reason.
     */
    public function approve(Request $request, Result $result)
    {
        $result->update([
            'status' => 'approved',
            'approval_status' => 'approved',
            'rejection_reason' => null,
        ]);

        return response()->json([
            'message' => 'Result approved successfully.',
            'data' => $result,
        ], 200);
    }

    /**
     * Reject a specific student result record with mandatory rejection feedback.
     * Flexible input resolution accepts 'rejection_reason', 'reason', or 'rejectionReason' keys
     * to ensure frontend payload compatibility and avoid 422 Unprocessable Content validation errors.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Result|int|string  $result
     * @return \Illuminate\Http\JsonResponse
     */
    public function reject(Request $request, Result $result)
    {
        // Fallback to safely catch any key sent by frontend, including raw json content
        $data = $request->json()->all() ?: $request->all();
        
        $reasonText = $data['rejection_reason'] 
            ?? $data['reason'] 
            ?? $data['rejectionReason'] 
            ?? $request->input('rejection_reason') 
            ?? $request->input('reason') 
            ?? $request->input('rejectionReason');

        // Force merge so validation and update can use it directly
        $request->merge([
            'rejection_reason' => $reasonText,
            'reason' => $reasonText,
        ]);

        // Validate that rejection reason is present and non-empty
        $validated = $request->validate([
            'rejection_reason' => 'required|string',
        ]);

        // Update database status, approval_status, and rejection reason feedback column
        $result->forceFill([
            'status'           => 'rejected',
            'approval_status'   => 'rejected',
            'rejection_reason' => $reasonText,
        ])->save();

        return response()->json([
            'message' => 'Result rejected and returned for teacher correction.',
            'data'    => $result,
        ], 200);
    }

    /**
     * Generate Class Performance Report for a given class ID, term, and academic session.
     * Endpoint: /api/exam-officer/reports/class?class_id=X&term=Y&session=Z
     * OR:       /api/exam-officer/reports/class/{class}?term=Y&session=Z
     */
    public function classReport(Request $request, $classId = null)
    {
        $classId = $request->query('class_id') ?: $classId;

        if (!$classId) {
            return response()->json([
                'message' => 'The class_id query parameter is required.'
            ], 422);
        }

        $activeTermObj = AcademicTerm::where('is_current', true)->first() ?? AcademicTerm::latest()->first();
        $defaultTerm = $activeTermObj?->term ?? '1st Term';
        $defaultSession = $activeTermObj?->session ?? '2025/2026';

        $term = $request->query('term') ?: $defaultTerm;
        $session = $request->query('session') ?: $defaultSession;

        $schoolClass = SchoolClass::find($classId);
        if (!$schoolClass) {
            return response()->json([
                'message' => "Class not found for ID: {$classId}"
            ], 404);
        }

        $schoolSettings = SchoolSetting::first();

        // Ultra-flexible smart term matching variations
        $termVariations = array_values(array_unique([
            $term,
            str_replace(['1st', '2nd', '3rd'], ['First', 'Second', 'Third'], $term),
            str_replace(['First', 'Second', 'Third'], ['1st', '2nd', '3rd'], $term),
            str_replace(['1st Term', '2nd Term', '3rd Term'], ['Term 1', 'Term 2', 'Term 3'], $term),
            str_replace(['First Term', 'Second Term', 'Third Term'], ['Term 1', 'Term 2', 'Term 3'], $term),
            str_replace(['Term 1', 'Term 2', 'Term 3'], ['1st Term', '2nd Term', '3rd Term'], $term),
            str_replace(['Term 1', 'Term 2', 'Term 3'], ['First Term', 'Second Term', 'Third Term'], $term),
            str_replace(['1st Term', '2nd Term', '3rd Term', 'First Term', 'Second Term', 'Third Term', 'Term 1', 'Term 2', 'Term 3'], ['1', '2', '3', '1', '2', '3', '1', '2', '3'], $term),
        ]));

        // Fetch all students belonging to the class
        $students = Student::where('class_id', $classId)
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();

        $studentsReport = [];

        foreach ($students as $student) {
            $approvedResults = Result::where('student_id', $student->id)
                ->whereIn('term', $termVariations)
                ->where('academic_session', $session)
                ->where(function ($q) {
                    $q->where('approval_status', 'approved')
                      ->orWhere('status', 'approved');
                })
                ->with('subject')
                ->get();

            $formattedResults = [];
            $totalScore = 0;
            $subjectCount = 0;

            foreach ($approvedResults as $res) {
                $ca = (float) ($res->ca_score ?? 0);
                $exam = (float) ($res->exam_score ?? 0);
                $total = (float) ($res->total_score ?? ($ca + $exam));

                $formattedResults[] = [
                    'id' => $res->id,
                    'subject_id' => $res->subject_id,
                    'subject_name' => $res->subject?->name ?? 'Unknown',
                    'subject_code' => $res->subject?->code ?? $res->subject?->subject_code ?? 'SUB',
                    'ca_score' => $ca,
                    'exam_score' => $exam,
                    'total_score' => $total,
                    'grade' => $res->grade ?? '',
                    'remark' => $res->remark ?? '',
                    'status' => $res->approval_status ?? $res->status ?? 'approved',
                ];

                $totalScore += $total;
                $subjectCount++;
            }

            $average = $subjectCount > 0 ? round($totalScore / $subjectCount, 2) : 0;
            $studentName = $student->name ?? trim(($student->first_name ?? '') . ' ' . ($student->last_name ?? ''));

            $studentsReport[] = [
                'student_id' => $student->id,
                'student_name' => $studentName ?: 'Unknown Student',
                'admission_number' => $student->admission_number ?? 'N/A',
                'gender' => $student->gender ?? 'N/A',
                'fee_cleared' => (bool) ($student->fee_cleared_status ?? true),
                'results' => $formattedResults,
                'total_score' => $totalScore,
                'average' => $average,
                'subject_count' => $subjectCount,
            ];
        }

        return response()->json([
            'school' => $schoolSettings,
            'class' => [
                'id' => $schoolClass->id,
                'name' => $schoolClass->name,
                'arm' => $schoolClass->arm ?? '',
                'full_name' => trim($schoolClass->name . ' ' . ($schoolClass->arm ?? '')),
            ],
            'term' => $term,
            'session' => $session,
            'report' => $studentsReport,
            'students' => $studentsReport,
        ], 200);
    }
}
