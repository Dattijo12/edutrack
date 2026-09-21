<?php

namespace App\Http\Controllers\ExamOfficer;

use App\Http\Controllers\Controller;
use App\Models\Result;
use App\Models\SchoolClass;
use App\Models\SchoolSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ResultController extends Controller
{
    /**
     * List all results awaiting approval.
     */
    public function pending()
    {
        $results = Result::where('approval_status', 'pending')
            ->with(['student.class', 'subject', 'teacher'])
            ->get();
        return response()->json($results, 200);
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
            'approval_status'   => 'needs_correction',
            'rejection_reason' => $reasonText,
        ])->save();

        return response()->json([
            'message' => 'Result rejected and returned for teacher correction.',
            'data'    => $result,
        ], 200);
    }

    /**
     * Generate a class report for a given academic session.
     * Returns aggregated results per student.
     */
    public function classReport($classId)
    {
        $class = SchoolClass::findOrFail($classId);
        $school = SchoolSetting::first();
        $report = Result::whereHas('student', function ($q) use ($classId) {
                $q->where('class_id', $classId);
            })
            ->with(['student', 'subject'])
            ->get()
            ->groupBy('student.id')
            ->map(function ($studentResults) {
                return $studentResults->map(function ($res) {
                    return [
                        'student_name' => $res->student->name,
                        'admission_number' => $res->student->admission_number,
                        'subject' => $res->subject->name,
                        'ca_score' => $res->ca_score,
                        'exam_score' => $res->exam_score,
                        'total' => $res->total_score,
                        'grade' => $res->grade,
                        'status' => $res->approval_status,
                    ];
                });
            });
        return response()->json([
            'class' => $class->name . ' ' . $class->arm,
            'school' => $school,
            'report' => $report,
        ], 200);
    }
}
