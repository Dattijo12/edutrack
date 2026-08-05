<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SubjectAssignment;
use App\Models\User;
use App\Models\SchoolClass;
use App\Models\Subject;
use Illuminate\Http\Request;

class SubjectAssignmentController extends Controller
{
    public function index()
    {
        $assignments = SubjectAssignment::with(['teacher', 'schoolClass', 'subject'])->get();
        return response()->json($assignments, 200);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'teacher_id' => 'required|exists:users,id',
            'class_id' => 'required|exists:classes,id',
            'subject_id' => 'required|exists:subjects,id',
        ]);

        // Check if teacher is active teacher
        $teacher = User::find($validated['teacher_id']);
        if (!$teacher || ($teacher->role !== 'teacher' && $teacher->role !== 'form_master')) {
            return response()->json(['message' => 'Selected user is not a teacher.'], 422);
        }

        $assignment = SubjectAssignment::firstOrCreate([
            'teacher_id' => $validated['teacher_id'],
            'class_id' => $validated['class_id'],
            'subject_id' => $validated['subject_id'],
        ]);

        return response()->json([
            'message' => 'Subject assigned to teacher successfully',
            'data' => $assignment->load(['teacher', 'schoolClass', 'subject'])
        ], 201);
    }

    public function destroy(SubjectAssignment $assignment)
    {
        $assignment->delete();
        return response()->json(['message' => 'Subject assignment removed successfully'], 200);
    }
}
