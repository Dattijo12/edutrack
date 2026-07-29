<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Http\Requests\Teacher\StoreResultRequest;
use App\Http\Requests\Teacher\UpdateResultRequest;
use App\Models\Result;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ResultController extends Controller
{
    /**
     * Display a listing of results recorded by the teacher.
     */
    public function index(Request $request)
    {
        $teacherId = $request->user()->id;
        
        $results = Result::where('teacher_id', $teacherId)
            ->with(['student.class', 'subject'])
            ->get();

        return response()->json($results, 200);
    }

    /**
     * Store a newly created result in storage.
     */
    public function store(StoreResultRequest $request)
    {
        $validated = $request->validated();

        // Check if result already exists (composite unique constraint check)
        $exists = Result::where([
            'student_id' => $validated['student_id'],
            'subject_id' => $validated['subject_id'],
            'term' => $validated['term'],
            'academic_session' => $validated['academic_session'],
        ])->exists();

        if ($exists) {
            throw ValidationException::withMessages([
                'student_id' => ['A result for this student, subject, term, and academic session already exists.'],
            ]);
        }

        // Calculate total score and letter grade
        $totalScore = $validated['ca_score'] + $validated['exam_score'];
        $grade = $this->calculateGrade($totalScore);

        $result = Result::create([
            'student_id' => $validated['student_id'],
            'subject_id' => $validated['subject_id'],
            'teacher_id' => $request->user()->id,
            'ca_score' => $validated['ca_score'],
            'exam_score' => $validated['exam_score'],
            'total_score' => $totalScore,
            'grade' => $grade,
            'term' => $validated['term'],
            'academic_session' => $validated['academic_session'],
            'approval_status' => 'pending'
        ]);

        return response()->json([
            'message' => 'Result uploaded successfully',
            'data' => $result->load(['student.class', 'subject'])
        ], 201);
    }

    /**
     * Display the specified result.
     */
    public function show(Request $request, Result $result)
    {
        // Enforce ownership
        if ($result->teacher_id !== $request->user()->id) {
            return response()->json(['message' => 'Access denied. You did not record this result.'], 403);
        }

        return response()->json($result->load(['student.class', 'subject']), 200);
    }

    /**
     * Update the specified result in storage.
     */
    public function update(UpdateResultRequest $request, Result $result)
    {
        // Enforce ownership
        if ($result->teacher_id !== $request->user()->id) {
            return response()->json(['message' => 'Access denied. You did not record this result.'], 403);
        }

        // Enforce lock on approved results
        if ($result->approval_status === 'approved') {
            return response()->json(['message' => 'Cannot edit result that has already been approved.'], 422);
        }

        $validated = $request->validated();

        // Re-calculate total score and grade
        $totalScore = $validated['ca_score'] + $validated['exam_score'];
        $grade = $this->calculateGrade($totalScore);

        // Keep existing non-updatable values, update scores, status is reset to pending if rejected
        $result->update([
            'ca_score' => $validated['ca_score'],
            'exam_score' => $validated['exam_score'],
            'total_score' => $totalScore,
            'grade' => $grade,
            'approval_status' => 'pending' // Re-evaluate status on update
        ]);

        return response()->json([
            'message' => 'Result updated successfully',
            'data' => $result->load(['student.class', 'subject'])
        ], 200);
    }

    /**
     * Helper: List all classes (for teacher dropdown).
     */
    public function classes()
    {
        return response()->json(SchoolClass::all(), 200);
    }

    /**
     * Helper: List all subjects (for teacher dropdown).
     */
    public function subjects()
    {
        return response()->json(Subject::all(), 200);
    }

    /**
     * Helper: List students in a specific class.
     */
    public function students(Request $request)
    {
        $request->validate([
            'class_id' => 'required|exists:classes,id'
        ]);

        $students = Student::where('class_id', $request->class_id)->get();
        
        return response()->json($students, 200);
    }

    /**
     * Determine the letter grade based on the total score.
     */
    private function calculateGrade(float $score): string
    {
        if ($score >= 70) return 'A';
        if ($score >= 60) return 'B';
        if ($score >= 50) return 'C';
        if ($score >= 45) return 'D';
        if ($score >= 40) return 'E';
        return 'F';
    }
}
