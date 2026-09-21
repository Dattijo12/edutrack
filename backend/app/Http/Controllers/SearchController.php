<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Student;
use App\Models\SchoolClass;
use App\Models\Subject;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    /**
     * Unified search endpoint for Command Palette.
     */
    public function index(Request $request)
    {
        $query = $request->query('q');

        if (empty($query)) {
            return response()->json([
                'students' => [],
                'staff' => [],
                'classes' => [],
                'subjects' => []
            ]);
        }

        $students = Student::where('first_name', 'like', "%{$query}%")
            ->orWhere('last_name', 'like', "%{$query}%")
            ->orWhere('admission_number', 'like', "%{$query}%")
            ->limit(5)
            ->get(['id', 'first_name', 'last_name', 'admission_number']);

        $staff = User::where('name', 'like', "%{$query}%")
            ->orWhere('email', 'like', "%{$query}%")
            ->limit(5)
            ->get(['id', 'name', 'email', 'role']);

        $classes = SchoolClass::where('name', 'like', "%{$query}%")
            ->limit(5)
            ->get(['id', 'name', 'level']);

        $subjects = Subject::where('name', 'like', "%{$query}%")
            ->orWhere('code', 'like', "%{$query}%")
            ->limit(5)
            ->get(['id', 'name', 'code']);

        return response()->json([
            'students' => $students,
            'staff' => $staff,
            'classes' => $classes,
            'subjects' => $subjects
        ]);
    }
}
