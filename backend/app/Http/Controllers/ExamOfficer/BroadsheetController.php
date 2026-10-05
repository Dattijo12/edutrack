<?php

namespace App\Http\Controllers\ExamOfficer;

use App\Http\Controllers\Controller;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Result;
use App\Models\SchoolSetting;
use App\Models\TermSummary;
use App\Models\AcademicTerm;
use App\Services\GradingService;
use Illuminate\Http\Request;

class BroadsheetController extends Controller
{
    /**
     * Get Broadsheet Summary Data Structure for Matrix Rendering.
     * Endpoint: /api/exam-officer/broadsheet?class_id=X&term=Y&session=Z
     */
    public function getBroadsheet(Request $request, $classId = null)
    {
        $classId = $request->query('class_id') ?: $classId;

        if (!$classId) {
            return response()->json([
                'message' => 'The class_id query parameter is required.'
            ], 422);
        }

        $activeTermObj = AcademicTerm::where('is_current', true)->first() ?? AcademicTerm::latest()->first();
        $defaultTerm = $activeTermObj?->term ?? '1st Term';
        $defaultSession = $activeTermObj?->session ?? '2025/2026';

        $term = $request->query('term') ?: $defaultTerm;
        $session = $request->query('session') ?: $defaultSession;

        $schoolClass = SchoolClass::find($classId);
        if (!$schoolClass) {
            return response()->json([
                'message' => "Class not found for ID: {$classId}"
            ], 404);
        }

        $schoolSettings = SchoolSetting::first();

        // 1. Fetch all students belonging to the specified class_id
        $students = Student::where('class_id', $classId)
            ->orderBy('first_name')
            ->orderBy('last_name')
            ->get();

        // 2. Fetch all subjects offered / available
        $subjects = Subject::orderBy('name')->get()->map(function ($subject) {
            return [
                'id' => $subject->id,
                'name' => $subject->name,
                'code' => $subject->code ?? $subject->subject_code ?? 'SUB',
            ];
        });

        // 3. For each student, fetch approved results for specified term & session
        $studentsData = [];

        // Flexible term variations for smart term matching
        $termVariations = array_values(array_unique([
            $term,
            str_replace(['1st', '2nd', '3rd'], ['First', 'Second', 'Third'], $term),
            str_replace(['First', 'Second', 'Third'], ['1st', '2nd', '3rd'], $term),
            str_replace(['1st Term', '2nd Term', '3rd Term'], ['Term 1', 'Term 2', 'Term 3'], $term),
            str_replace(['First Term', 'Second Term', 'Third Term'], ['Term 1', 'Term 2', 'Term 3'], $term),
            str_replace(['Term 1', 'Term 2', 'Term 3'], ['1st Term', '2nd Term', '3rd Term'], $term),
            str_replace(['Term 1', 'Term 2', 'Term 3'], ['First Term', 'Second Term', 'Third Term'], $term),
            str_replace(['1st Term', '2nd Term', '3rd Term', 'First Term', 'Second Term', 'Third Term', 'Term 1', 'Term 2', 'Term 3'], ['1', '2', '3', '1', '2', '3', '1', '2', '3'], $term),
        ]));

        foreach ($students as $student) {
            $approvedResults = Result::where('student_id', $student->id)
                ->whereIn('term', $termVariations)
                ->where('academic_session', $session)
                ->where(function ($q) {
                    $q->where('approval_status', 'approved')
                      ->orWhere('status', 'approved');
                })
                ->get();

            $resultsMap = [];
            $totalMarks = 0;
            $subjectCount = 0;

            foreach ($approvedResults as $res) {
                $ca = (float) ($res->ca_score ?? 0);
                $exam = (float) ($res->exam_score ?? 0);
                $total = (float) ($res->total_score ?? ($ca + $exam));
                $subjectKey = (string) $res->subject_id;

                $resultsMap[$subjectKey] = [
                    'id' => $res->id,
                    'ca' => $ca,
                    'exam' => $exam,
                    'total' => $total,
                    'grade' => $res->grade ?? '',
                    'status' => $res->approval_status ?? $res->status ?? 'approved',
                ];

                $totalMarks += $total;
                $subjectCount++;
            }

            $average = $subjectCount > 0 ? round($totalMarks / $subjectCount, 2) : 0;

            $studentName = $student->name ?? trim(($student->first_name ?? '') . ' ' . ($student->last_name ?? ''));

            $studentsData[] = [
                'id' => $student->id,
                'name' => $studentName ?: 'Unknown Student',
                'admission_number' => $student->admission_number ?? 'N/A',
                'gender' => $student->gender ?? 'N/A',
                'fee_cleared' => (bool) ($student->fee_cleared_status ?? true),
                'results' => (object) $resultsMap,
                'total_marks' => $totalMarks,
                'average' => $average,
                'subject_count' => $subjectCount,
            ];
        }

        // Sort students by average descending to compute class position
        usort($studentsData, fn($a, $b) => $b['average'] <=> $a['average']);

        $rank = 1;
        foreach ($studentsData as $idx => &$stData) {
            if ($idx > 0 && $stData['average'] < $studentsData[$idx - 1]['average']) {
                $rank = $idx + 1;
            }
            $stData['class_position'] = $rank;
            $stData['class_position_formatted'] = GradingService::ordinal($rank);
        }

        return response()->json([
            'school' => $schoolSettings,
            'class' => [
                'id' => $schoolClass->id,
                'name' => $schoolClass->name,
                'arm' => $schoolClass->arm ?? '',
                'full_name' => trim($schoolClass->name . ' ' . ($schoolClass->arm ?? '')),
            ],
            'term' => $term,
            'session' => $session,
            'subjects' => $subjects,
            'students' => $studentsData,
        ], 200);
    }

    /**
     * Generate 1-Click Class Broadsheet (A4 Landscape Data Grid)
     */
    public function generateBroadsheet(Request $request, $classId = null)
    {
        return $this->getBroadsheet($request, $classId);
    }

    /**
     * Generate Comprehensive Student Report Card with QR Verification Hash, QR Graphic & Fee Gatekeeper Check.
     */
    public function generateReportCard(Request $request, $studentId)
    {
        $activeTermObj = AcademicTerm::where('is_current', true)->first() ?? AcademicTerm::latest()->first();
        $defaultTerm = $activeTermObj?->term ?? '1st Term';
        $defaultSession = $activeTermObj?->session ?? '2025/2026';

        $term = $request->query('term') ?: $defaultTerm;
        $session = $request->query('session') ?: $defaultSession;

        $student = Student::with('class')->findOrFail($studentId);
        $settings = SchoolSetting::first();
        $termObj = AcademicTerm::where('session', $session)->where('term', $term)->first();

        // Financial Gatekeeper Check
        if (!$student->fee_cleared_status) {
            return response()->json([
                'locked' => true,
                'message' => 'Report Card is locked due to outstanding school fee balance. Please visit the Bursar office.',
                'student' => [
                    'name' => $student->name,
                    'admission_number' => $student->admission_number,
                    'class' => $student->class ? ($student->class->name . ' ' . $student->class->arm) : 'N/A',
                    'fee_cleared_status' => false,
                ]
            ], 403);
        }

        // Fetch student's approved subject results for the report card with term normalization
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

        // Fallback: If no approved results match strict term/session, fetch any approved results for the student
        if ($results->isEmpty()) {
            $results = Result::where('student_id', $student->id)
                ->where(function ($query) {
                    $query->where('approval_status', 'approved')
                          ->orWhere('status', 'approved');
                })
                ->with('subject')
                ->get();
        }

        $verificationHash = md5("EDUTRACK_{$student->id}_{$term}_{$session}_VERIFIED");
        $verificationUrl = url("/verify-result/{$verificationHash}");

        // Generate QR code image URL graphic using QR server API endpoint
        $qrCodeGraphic = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" . urlencode($verificationUrl);

        // Format each result to ensure scores, WAEC grades, and remarks match frontend expectations
        $formattedResults = $results->map(function ($res) use ($verificationHash) {
            if (!$res->verification_hash) {
                $res->verification_hash = $verificationHash;
                $res->save();
            }

            $ca = (float) ($res->ca_score ?? 0);
            $exam = (float) ($res->exam_score ?? 0);
            $total = (float) ($res->total_score ?? ($ca + $exam));
            $gradeDetails = GradingService::calculateGrade($total);

            return [
                'id' => $res->id,
                'subject_id' => $res->subject_id,
                'subject' => [
                    'id' => $res->subject?->id,
                    'name' => $res->subject?->name ?? 'Subject',
                    'code' => $res->subject?->code ?? 'SUB',
                ],
                'ca_score' => $ca,
                'exam_score' => $exam,
                'total_score' => $total,
                'grade' => $res->grade ?: $gradeDetails['grade'],
                'remark' => $res->remark ?: $gradeDetails['remark'],
                'approval_status' => $res->approval_status ?? $res->status ?? 'approved',
            ];
        });

        $summary = TermSummary::where('student_id', $student->id)
            ->when($termObj, fn($q) => $q->where('term_id', $termObj->id))
            ->first();

        // Calculate aggregate performance metrics
        $totalMarks = $formattedResults->sum('total_score');
        $subjectCount = $formattedResults->count();
        $average = $subjectCount > 0 ? round($totalMarks / $subjectCount, 2) : 0;

        return response()->json([
            'locked' => false,
            'school' => $settings,
            'student' => [
                'id' => $student->id,
                'name' => $student->name,
                'admission_number' => $student->admission_number,
                'gender' => $student->gender ?? 'N/A',
                'class_name' => $student->class ? ($student->class->name . ' ' . $student->class->arm) : 'N/A',
                'fee_cleared' => true,
            ],
            'term' => $term,
            'session' => $session,
            'results' => $formattedResults,
            'summary' => [
                'total_marks' => $totalMarks,
                'average' => $average,
                'subject_count' => $subjectCount,
                'form_master_remark' => $summary->form_master_remark ?? 'Satisfactory academic performance and good general conduct.',
                'principal_remark' => $summary->principal_remark ?? 'Good result. Encouraged to aim higher next term.',
                'attendance' => ($summary->attendance_present ?? 65) . ' / ' . ($summary->attendance_total ?? 70),
            ],
            'verification_hash' => $verificationHash,
            'verification_url' => $verificationUrl,
            'qr_code' => $qrCodeGraphic,
        ], 200);
    }

    /**
     * Public Result Verification Endpoint (Dynamic QR verification)
     */
    public function verifyResult($hash)
    {
        $result = Result::where('verification_hash', $hash)->with(['student.class', 'subject'])->first();

        if (!$result) {
            return response()->json([
                'valid' => false,
                'message' => 'Invalid or unverified report card QR code.',
            ], 404);
        }

        $settings = SchoolSetting::first();

        return response()->json([
            'valid' => true,
            'message' => 'AUTHENTIC RESULT VERIFIED',
            'school_name' => $settings?->name ?? 'EduTrack Academy',
            'student' => $result->student?->name ?? 'Unknown Student',
            'admission_number' => $result->student?->admission_number ?? 'N/A',
            'class' => $result->student?->class ? ($result->student->class->name . ' ' . $result->student->class->arm) : 'Unknown Class',
            'term' => $result->term,
            'session' => $result->academic_session,
            'timestamp' => $result->created_at->format('Y-m-d H:i:s'),
        ], 200);
    }
}
