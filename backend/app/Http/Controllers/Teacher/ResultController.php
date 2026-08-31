<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Result;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\Student;
use App\Models\SubjectAssignment;
use App\Services\GradingService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ResultController extends Controller
{
    public function index(Request $request)
    {
        $teacherId = $request->user()->id;

        $results = Result::where('teacher_id', $teacherId)
            ->with(['student.class', 'subject'])
            ->get();

        return response()->json($results, 200);
    }

    public function store(Request $request)
    {
        $maxScores = GradingService::getMaxScores();

        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'subject_id' => 'required|exists:subjects,id',
            'ca_score' => "required|numeric|min:0|max:{$maxScores['max_ca']}",
            'exam_score' => "required|numeric|min:0|max:{$maxScores['max_exam']}",
            'term' => 'required|string',
            'academic_session' => 'required|string',
        ]);

        $student = Student::findOrFail($validated['student_id']);

        // Calculate total score and WAEC/NECO grade & remark
        $totalScore = (float)$validated['ca_score'] + (float)$validated['exam_score'];
        $gradeInfo = GradingService::calculateGrade($totalScore);

        $result = Result::updateOrCreate(
            [
                'student_id' => $validated['student_id'],
                'subject_id' => $validated['subject_id'],
                'term' => $validated['term'],
                'academic_session' => $validated['academic_session'],
            ],
            [
                'class_id' => $student->class_id,
                'teacher_id' => $request->user()->id,
                'ca_score' => $validated['ca_score'],
                'exam_score' => $validated['exam_score'],
                'total_score' => $totalScore,
                'grade' => $gradeInfo['grade'],
                'remark' => $gradeInfo['remark'],
                'approval_status' => 'pending',
                'verification_hash' => md5("EDUTRACK_{$validated['student_id']}_{$validated['term']}_{$validated['academic_session']}_VERIFIED"),
            ]
        );

        // Recalculate positions for this subject and class
        GradingService::updateSubjectPositions(
            $validated['subject_id'],
            $student->class_id,
            $validated['term'],
            $validated['academic_session']
        );

        return response()->json([
            'message' => 'Result recorded successfully',
            'data' => $result->load(['student.class', 'subject'])
        ], 201);
    }

    public function show(Request $request, Result $result)
    {
        return response()->json($result->load(['student.class', 'subject']), 200);
    }

    public function update(Request $request, Result $result)
    {
        if ($result->approval_status === 'approved' && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Cannot edit approved result.'], 422);
        }

        $maxScores = GradingService::getMaxScores();

        $validated = $request->validate([
            'ca_score' => "required|numeric|min:0|max:{$maxScores['max_ca']}",
            'exam_score' => "required|numeric|min:0|max:{$maxScores['max_exam']}",
        ]);

        $totalScore = (float)$validated['ca_score'] + (float)$validated['exam_score'];
        $gradeInfo = GradingService::calculateGrade($totalScore);

        $result->update([
            'ca_score' => $validated['ca_score'],
            'exam_score' => $validated['exam_score'],
            'total_score' => $totalScore,
            'grade' => $gradeInfo['grade'],
            'remark' => $gradeInfo['remark'],
            'approval_status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Result updated successfully',
            'data' => $result->load(['student.class', 'subject'])
        ], 200);
    }

    public function classes(Request $request)
    {
        $teacherId = $request->user()->id;

        if ($request->user()->isAdmin() || $request->user()->isExamOfficer()) {
            return response()->json(SchoolClass::all(), 200);
        }

        // Return only classes this teacher is assigned to via subject assignments
        $classIds = SubjectAssignment::where('teacher_id', $teacherId)->pluck('class_id')->unique();
        $classes = SchoolClass::whereIn('id', $classIds)->get();

        return response()->json($classes, 200);
    }

    public function subjects(Request $request)
    {
        $teacherId = $request->user()->id;

        if ($request->user()->isAdmin() || $request->user()->isExamOfficer()) {
            return response()->json(Subject::all(), 200);
        }

        // Return only subjects this teacher is assigned to
        $subjectIds = SubjectAssignment::where('teacher_id', $teacherId)->pluck('subject_id')->unique();
        $subjects = Subject::whereIn('id', $subjectIds)->get();

        return response()->json($subjects, 200);
    }

    public function students(Request $request)
    {
        $request->validate([
            'class_id' => 'required|exists:classes,id'
        ]);

        $students = Student::where('class_id', $request->class_id)->get();
        return response()->json($students, 200);
    }

    public function maxScores()
    {
        return response()->json(GradingService::getMaxScores(), 200);
    }
}
