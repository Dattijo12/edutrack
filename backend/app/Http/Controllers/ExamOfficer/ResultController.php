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
     * Approve a specific result.
     */
    public function approve(Request $request, Result $result)
    {
        $result->update(['approval_status' => 'approved']);
        return response()->json(['message' => 'Result approved', 'data' => $result], 200);
    }

    /**
     * Reject a specific result.
     */
    public function reject(Request $request, Result $result)
    {
        $result->update(['approval_status' => 'rejected']);
        return response()->json(['message' => 'Result rejected', 'data' => $result], 200);
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
