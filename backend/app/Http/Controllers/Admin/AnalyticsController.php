<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SchoolClass;
use App\Models\Student;

class AnalyticsController extends Controller
{
    public function enrollment()
    {
        $classes = SchoolClass::all();
        $analytics = [];

        foreach ($classes as $class) {
            $count = Student::where('class_id', $class->id)->count();
            
            $className = $class->name . ($class->arm ? ' ' . $class->arm : '');
            
            $analytics[] = [
                'class_name' => $className,
                'student_count' => $count
            ];
        }

        return response()->json($analytics, 200);
    }
}
