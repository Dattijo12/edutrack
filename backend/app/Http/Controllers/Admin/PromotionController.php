<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SchoolClass;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PromotionController extends Controller
{
    public function promote(Request $request)
    {
        $validated = $request->validate([
            'from_class_id' => 'required|exists:classes,id',
            'to_class_id' => 'required|exists:classes,id|different:from_class_id',
        ]);

        $fromClass = SchoolClass::findOrFail($validated['from_class_id']);
        $toClass = SchoolClass::findOrFail($validated['to_class_id']);

        DB::transaction(function () use ($fromClass, $toClass) {
            Student::where('class_id', $fromClass->id)->update([
                'class_id' => $toClass->id
            ]);
        });

        $count = Student::where('class_id', $toClass->id)->count();

        return response()->json([
            'message' => "Successfully promoted students from {$fromClass->name} {$fromClass->arm} to {$toClass->name} {$toClass->arm}.",
            'promoted_count' => $count
        ], 200);
    }
}
