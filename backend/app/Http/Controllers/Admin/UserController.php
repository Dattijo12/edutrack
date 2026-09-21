<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\SubjectAssignment;
use App\Models\SchoolClass;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

/**
 * Controller for managing staff user accounts and teacher assignments.
 */
class UserController extends Controller
{
    /**
     * Retrieve a filtered list of users with assigned classes and subjects.
     */
    public function index(Request $request)
    {
        $query = User::with([
            'subjectAssignments.schoolClass', 
            'subjectAssignments.subject', 
            'assignedClasses'
        ]);

        if ($request->has('role') && $request->role !== 'all') {
            $query->where('role', $request->role);
        }

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        return response()->json($query->orderBy('name')->get(), 200);
    }

    /**
     * Create a new staff account and assign initial subjects/classes if applicable.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'nullable|string|max:20',
            'gender' => ['nullable', Rule::in(['Male', 'Female'])],
            'role' => ['required', Rule::in(['admin', 'exam_officer', 'bursar', 'form_master', 'teacher'])],
            'password' => 'required|string|min:6',
            'status' => ['required', Rule::in(['active', 'inactive'])],
            'assigned_class_id' => 'nullable|exists:classes,id',
            'assigned_class_ids' => 'nullable|array',
            'assigned_class_ids.*' => 'exists:classes,id',
            'assigned_subject_ids' => 'nullable|array',
            'assigned_subject_ids.*' => 'exists:subjects,id',
        ]);

        if ($validated['role'] !== 'form_master') {
            $validated['assigned_class_id'] = null;
        }

        if ($validated['role'] !== 'teacher') {
            $validated['assigned_class_ids'] = null;
            $validated['assigned_subject_ids'] = null;
        }

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'gender' => $validated['gender'] ?? null,
            'role' => $validated['role'],
            'password' => Hash::make($validated['password']),
            'status' => $validated['status'],
        ]);

        if ($user->role === 'form_master' && !empty($validated['assigned_class_id'])) {
            SchoolClass::where('id', $validated['assigned_class_id'])
                ->update(['form_master_id' => $user->id]);
        }

        if ($user->role === 'teacher') {
            $classIds = $validated['assigned_class_ids'] ?? [];
            $subjectIds = $validated['assigned_subject_ids'] ?? [];

            if (!empty($classIds) && !empty($subjectIds)) {
                foreach ($classIds as $classId) {
                    foreach ($subjectIds as $subjectId) {
                        SubjectAssignment::firstOrCreate([
                            'teacher_id' => $user->id,
                            'class_id' => $classId,
                            'subject_id' => $subjectId,
                        ]);
                    }
                }
            }
        }

        return response()->json([
            'message' => 'Staff account created successfully',
            'data' => $user->load(['subjectAssignments.schoolClass', 'subjectAssignments.subject', 'assignedClasses'])
        ], 201);
    }

    /**
     * Show details of a specific staff user.
     */
    public function show(User $user)
    {
        return response()->json(
            $user->load(['subjectAssignments.schoolClass', 'subjectAssignments.subject', 'assignedClasses']),
            200
        );
    }

    /**
     * Update an existing staff account and sync updated class/subject assignments.
     */
    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => ['sometimes', 'required', 'email', Rule::unique('users')->ignore($user->id)],
            'phone' => 'nullable|string|max:20',
            'gender' => ['nullable', Rule::in(['Male', 'Female'])],
            'role' => ['sometimes', 'required', Rule::in(['admin', 'exam_officer', 'bursar', 'form_master', 'teacher'])],
            'status' => ['sometimes', 'required', Rule::in(['active', 'inactive'])],
            'password' => 'nullable|string|min:6',
            'assigned_class_id' => 'nullable|exists:classes,id',
            'assigned_class_ids' => 'nullable|array',
            'assigned_class_ids.*' => 'exists:classes,id',
            'assigned_subject_ids' => 'nullable|array',
            'assigned_subject_ids.*' => 'exists:subjects,id',
        ]);

        $role = $validated['role'] ?? $user->role;

        if ($role !== 'form_master') {
            $validated['assigned_class_id'] = null;
        }

        if ($role !== 'teacher') {
            $validated['assigned_class_ids'] = null;
            $validated['assigned_subject_ids'] = null;
            SubjectAssignment::where('teacher_id', $user->id)->delete();
        }

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        if ($user->role === 'teacher') {
            $hasClasses = array_key_exists('assigned_class_ids', $validated);
            $hasSubjects = array_key_exists('assigned_subject_ids', $validated);

            if ($hasClasses || $hasSubjects) {
                $classIds = $hasClasses 
                    ? ($validated['assigned_class_ids'] ?? [])
                    : SubjectAssignment::where('teacher_id', $user->id)->pluck('class_id')->unique()->toArray();

                $subjectIds = $hasSubjects 
                    ? ($validated['assigned_subject_ids'] ?? [])
                    : SubjectAssignment::where('teacher_id', $user->id)->pluck('subject_id')->unique()->toArray();

                SubjectAssignment::where('teacher_id', $user->id)->delete();

                if (!empty($classIds) && !empty($subjectIds)) {
                    foreach ($classIds as $classId) {
                        foreach ($subjectIds as $subjectId) {
                            SubjectAssignment::firstOrCreate([
                                'teacher_id' => $user->id,
                                'class_id' => $classId,
                                'subject_id' => $subjectId,
                            ]);
                        }
                    }
                }
            }
        }

        if (array_key_exists('assigned_class_id', $validated)) {
            // Reset previous class assignments for this user
            SchoolClass::where('form_master_id', $user->id)->update(['form_master_id' => null]);
            
            if ($user->role === 'form_master' && $validated['assigned_class_id']) {
                SchoolClass::where('id', $validated['assigned_class_id'])
                    ->update(['form_master_id' => $user->id]);
            }
        }

        return response()->json([
            'message' => 'User account updated successfully',
            'data' => $user->load(['subjectAssignments.schoolClass', 'subjectAssignments.subject', 'assignedClasses'])
        ], 200);
    }

    /**
     * Delete a staff user account.
     */
    public function destroy(User $user)
    {
        if ($user->id === auth()->id()) {
            return response()->json(['message' => 'Cannot delete your own account'], 422);
        }

        $user->delete();

        return response()->json([
            'message' => 'User account deleted successfully'
        ], 200);
    }
}
