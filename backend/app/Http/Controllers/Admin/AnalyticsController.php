<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SchoolClass;
use App\Models\Student;

class AnalyticsController extends Controller
{
    public function enrollment()
    {
        $classes = SchoolClass::orderBy('name')->get();
        $analytics = [];

        foreach ($classes as $class) {
            $count = Student::where('class_id', $class->id)->count();
            
            $className = trim($class->name . ($class->arm ? ' ' . $class->arm : ''));
            
            $analytics[] = [
                'class_name' => $className,
                'name' => $className,
                'student_count' => $count,
                'count' => $count,
            ];
        }

        return response()->json($analytics, 200);
    }
}
