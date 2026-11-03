<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\User;
use App\Models\SchoolClass;
use App\Models\ResultWindow;
use Illuminate\Http\JsonResponse;

class AdminDashboardController extends Controller
{
    /**
     * Return aggregated dashboard statistics in a single JSON payload.
     *
     * This endpoint eliminates multiple round-trips from the React frontend
     * by combining counts, the active term window, and per-class enrollment
     * data into one response.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getDashboardStats(): JsonResponse
    {
        // 1. Total Students (excluding soft-deleted)
        $totalStudents = Student::count();

        // 2. Total Teachers — users whose role is exactly 'teacher'
        $totalTeachers = User::where('role', 'teacher')->count();

        // 3. Total Classes (excluding soft-deleted)
        $totalClasses = SchoolClass::count();

        // 4. Current Term — the most recently created open or published result window.
        //    Falls back to the latest window if none is currently open.
        $currentTerm = ResultWindow::where('is_open', true)->latest()->first()
            ?? ResultWindow::latest()->first();

        // 5. Students Per Class — efficient groupBy using withCount on the relationship.
        //    Returns class name + arm + enrolled student count for React bar/pie charts.
        $studentsPerClass = SchoolClass::withCount('students')
            ->orderBy('name')
            ->orderBy('arm')
            ->get()
            ->map(function (SchoolClass $class) {
                return [
                    'class_id'   => $class->id,
                    'class_name' => trim("{$class->name} {$class->arm}"),
                    'count'      => $class->students_count,
                ];
            });

        return response()->json([
            'status' => 'success',
            'data'   => [
                'total_students'    => $totalStudents,
                'total_teachers'    => $totalTeachers,
                'total_classes'     => $totalClasses,
                'current_term'      => $currentTerm ? [
                    'id'               => $currentTerm->id,
                    'academic_session' => $currentTerm->academic_session,
                    'term'             => $currentTerm->term,
                    'is_open'          => (bool) $currentTerm->is_open,
                    'is_published'     => (bool) $currentTerm->is_published,
                ] : null,
                'students_per_class' => $studentsPerClass,
            ],
        ]);
    }
}
