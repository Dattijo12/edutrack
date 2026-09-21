<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreStudentRequest;
use App\Http\Requests\Admin\UpdateStudentRequest;
use App\Models\Student;

class StudentController extends Controller
{
    /**
     * Display a listing of the students with optional search query and class filter.
     */
    public function index(\Illuminate\Http\Request $request)
    {
        $query = Student::with('class');

        $query->when($request->filled('search'), function ($q) use ($request) {
            $search = $request->search;
            $q->where(function ($sub) use ($search) {
                $sub->where('admission_number', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$search}%"]);
            });
        });

        $query->when($request->filled('class_id'), function ($q) use ($request) {
            $q->where('class_id', $request->class_id);
        });

        $students = $query->orderBy('first_name')->get();
        return response()->json($students, 200);
    }

    /**
     * Store a newly created student in storage.
     */
    public function store(StoreStudentRequest $request)
    {
        $validated = $request->validated();
        
        // Parse the full name from frontend into first_name and last_name schema fields
        $nameParts = explode(' ', trim($validated['name']), 2);
        $validated['first_name'] = $nameParts[0];
        $validated['last_name'] = $nameParts[1] ?? '';
        unset($validated['name']);

        // Maintain backward compatibility between parent_phone and guardian_phone
        if (isset($validated['parent_phone']) && empty($validated['guardian_phone'])) {
            $validated['guardian_phone'] = $validated['parent_phone'];
        }

        $student = Student::create($validated);

        return response()->json([
            'message' => 'Student registered successfully',
            'data' => $student->load('class')
        ], 201);
    }

    /**
     * Display the specified student.
     */
    public function show(Student $student)
    {
        return response()->json($student->load(['class', 'results']), 200);
    }

    /**
     * Update the specified student in storage.
     */
    public function update(UpdateStudentRequest $request, Student $student)
    {
        $validated = $request->validated();

        // Parse the full name from frontend into first_name and last_name schema fields
        $nameParts = explode(' ', trim($validated['name']), 2);
        $validated['first_name'] = $nameParts[0];
        $validated['last_name'] = $nameParts[1] ?? '';
        unset($validated['name']);

        // Maintain backward compatibility between parent_phone and guardian_phone
        if (isset($validated['parent_phone']) && empty($validated['guardian_phone'])) {
            $validated['guardian_phone'] = $validated['parent_phone'];
        }

        $student->update($validated);

        return response()->json([
            'message' => 'Student profile updated successfully',
            'data' => $student->load('class')
        ], 200);
    }

    /**
     * Remove the specified student from storage.
     */
    public function destroy(Student $student)
    {
        $student->delete();

        return response()->json([
            'message' => 'Student profile deleted successfully'
        ], 200);
    }
}
