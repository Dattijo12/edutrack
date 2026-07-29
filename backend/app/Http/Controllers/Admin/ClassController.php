<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreClassRequest;
use App\Http\Requests\Admin\UpdateClassRequest;
use App\Models\SchoolClass;

class ClassController extends Controller
{
    /**
     * Display a listing of the classes.
     */
    public function index()
    {
        $classes = SchoolClass::withCount('students')->get();
        return response()->json($classes, 200);
    }

    /**
     * Store a newly created class in storage.
     */
    public function store(StoreClassRequest $request)
    {
        $class = SchoolClass::create($request->validated());
        
        return response()->json([
            'message' => 'Class created successfully',
            'data' => $class
        ], 201);
    }

    /**
     * Display the specified class.
     */
    public function show(SchoolClass $class)
    {
        return response()->json($class->load('students'), 200);
    }

    /**
     * Update the specified class in storage.
     */
    public function update(UpdateClassRequest $request, SchoolClass $class)
    {
        $class->update($request->validated());

        return response()->json([
            'message' => 'Class updated successfully',
            'data' => $class
        ], 200);
    }

    /**
     * Remove the specified class from storage.
     */
    public function destroy(SchoolClass $class)
    {
        // Enforce the 'restrict' deletion check to prevent DB exception
        if ($class->students()->exists()) {
            return response()->json([
                'message' => 'Cannot delete class because it contains registered students.'
            ], 422);
        }

        $class->delete();

        return response()->json([
            'message' => 'Class deleted successfully'
        ], 200);
    }
}
