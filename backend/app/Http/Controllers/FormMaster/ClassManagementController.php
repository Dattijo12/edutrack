<?php

namespace App\Http\Controllers\FormMaster;

use App\Http\Controllers\Controller;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\TermSummary;
use App\Models\AcademicTerm;
use Illuminate\Http\Request;

class ClassManagementController extends Controller
{
    public function assignedClass(Request $request)
    {
        $user = $request->user();
        $class = SchoolClass::where('form_master_id', $user->id)->with('students')->first();

        if (!$class) {
            // Fallback: return first class for demonstration if not assigned specifically
            $class = SchoolClass::with('students')->first();
        }

        return response()->json($class, 200);
    }

    public function updateRemarks(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'class_id' => 'required|exists:classes,id',
            'term_id' => 'required|exists:academic_terms,id',
            'form_master_remark' => 'nullable|string',
            'principal_remark' => 'nullable|string',
            'attendance_present' => 'nullable|integer|min:0',
            'attendance_total' => 'nullable|integer|min:0',
        ]);

        $summary = TermSummary::firstOrNew([
            'student_id' => $validated['student_id'],
            'class_id' => $validated['class_id'],
            'term_id' => $validated['term_id'],
        ]);

        $summary->form_master_remark = $validated['form_master_remark'] ?? $summary->form_master_remark;
        $summary->principal_remark = $validated['principal_remark'] ?? $summary->principal_remark;
        $summary->attendance_present = $validated['attendance_present'] ?? $summary->attendance_present;
        $summary->attendance_total = $validated['attendance_total'] ?? $summary->attendance_total;
        $summary->save();

        return response()->json([
            'message' => 'Terminal remarks and attendance updated successfully',
            'data' => $summary
        ], 200);
    }
}
