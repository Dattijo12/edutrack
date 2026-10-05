<?php

namespace App\Http\Controllers\Guardian;

use App\Http\Controllers\Controller;
use App\Models\Guardian;
use App\Models\Student;
use App\Models\Result;
use App\Models\AcademicTerm;
use App\Models\SchoolSetting;
use Illuminate\Http\Request;

class GuardianDashboardController extends Controller
{
    /**
     * Fetch the authenticated user's associated Guardian profile, along with their linked students.
     * Eager loads each student's class.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        // Retrieve guardian profile associated with current authenticated user or matching phone
        $guardian = Guardian::with(['students.class'])
            ->where('user_id', $user->id)
            ->orWhere('phone', $user->phone)
            ->first();

        if (!$guardian) {
            return response()->json([
                'message' => 'Guardian profile not found for this user.',
                'guardian' => null,
                'students' => [],
            ], 404);
        }

        return response()->json([
            'message' => 'Guardian profile loaded successfully.',
            'guardian' => $guardian,
            'students' => $guardian->students,
        ], 200);
    }

    /**
     * Fetch report card data for a specific student.
     * Verifies that the student belongs to the authenticated Guardian.
     * Returns only approved results.
     */
    public function studentResults(Request $request, $studentId)
    {
        $user = $request->user();

        // Get guardian profile
        $guardian = Guardian::where('user_id', $user->id)
            ->orWhere('phone', $user->phone)
            ->first();

        if (!$guardian) {
            return response()->json(['message' => 'Unauthorized. Guardian profile not found.'], 403);
        }

        // Verify student belongs to this guardian
        $student = Student::with('class')->where('guardian_id', $guardian->id)->find($studentId);

        if (!$student) {
            return response()->json([
                'message' => 'Forbidden. This student is not linked to your guardian account.'
            ], 403);
        }

        $activeTermObj = AcademicTerm::where('is_current', true)->first() ?? AcademicTerm::latest()->first();
        $defaultTerm = $activeTermObj?->term ?? '1st Term';
        $defaultSession = $activeTermObj?->session ?? '2025/2026';

        $term = $request->query('term') ?: $defaultTerm;
        $session = $request->query('session') ?: $defaultSession;
        $settings = SchoolSetting::first();

        // Financial Gatekeeper Check
        if (!$student->fee_cleared_status) {
            return response()->json([
                'locked' => true,
                'message' => 'Report Card is locked due to outstanding school fee balance. Please contact the school Bursar.',
                'student' => [
                    'name' => $student->name,
                    'admission_number' => $student->admission_number,
                    'class' => $student->class ? ($student->class->name . ' ' . $student->class->arm) : 'N/A',
                    'fee_cleared_status' => false,
                ]
            ], 403);
        }

        // Query only APPROVED results
        $results = Result::where('student_id', $student->id)
            ->where(function ($q) use ($term) {
                $q->where('term', $term)
                  ->orWhere('term', str_replace(['1st Term', '2nd Term', '3rd Term'], ['First Term', 'Second Term', 'Third Term'], $term))
                  ->orWhere('term', str_replace(['First Term', 'Second Term', 'Third Term'], ['1st Term', '2nd Term', '3rd Term'], $term));
            })
            ->where('academic_session', $session)
            ->where(function ($query) {
                $query->where('approval_status', 'approved')
                      ->orWhere('status', 'approved');
            })
            ->with('subject')
            ->get();

        return response()->json([
            'school' => $settings,
            'student' => $student,
            'term' => $term,
            'session' => $session,
            'results' => $results,
        ], 200);
    }
}
