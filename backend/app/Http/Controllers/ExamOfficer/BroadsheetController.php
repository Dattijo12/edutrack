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
     * Generate 1-Click Class Broadsheet (A4 Landscape Data Grid)
     */
    public function generateBroadsheet(Request $request, $classId)
    {
        $term = $request->query('term', '1st Term');
        $session = $request->query('session', '2025/2026');

        $schoolClass = SchoolClass::findOrFail($classId);
        $students = Student::where('class_id', $classId)->orderBy('first_name')->get();
        $subjects = Subject::orderBy('code')->get();
        $settings = SchoolSetting::first();

        $broadsheetData = [];

        foreach ($students as $student) {
            $studentResults = Result::where('student_id', $student->id)
                ->where('term', $term)
                ->where('academic_session', $session)
                ->get()
                ->keyBy('subject_id');

            $subjectScores = [];
            $totalMarks = 0;
            $subjectCount = 0;

            foreach ($subjects as $subject) {
                $res = $studentResults->get($subject->id);
                if ($res) {
                    $subjectScores[$subject->id] = [
                        'id' => $res->id,
                        'ca' => (float)$res->ca_score,
                        'exam' => (float)$res->exam_score,
                        'total' => (float)$res->total_score,
                        'grade' => $res->grade,
                        'status' => $res->status ?? $res->approval_status ?? 'pending',
                        'approval_status' => $res->approval_status ?? $res->status ?? 'pending',
                        'rejection_reason' => $res->rejection_reason,
                    ];
                    $totalMarks += $res->total_score;
                    $subjectCount++;
                } else {
                    $subjectScores[$subject->id] = null;
                }
            }

            $average = $subjectCount > 0 ? round($totalMarks / $subjectCount, 2) : 0;

            $broadsheetData[] = [
                'student' => [
                    'id' => $student->id,
                    'name' => $student->name,
                    'admission_number' => $student->admission_number,
                    'gender' => $student->gender,
                    'fee_cleared' => $student->fee_cleared_status,
                ],
                'scores' => $subjectScores,
                'total_marks' => $totalMarks,
                'average' => $average,
                'subject_count' => $subjectCount,
            ];
        }

        // Sort students by average descending to compute class positions
        usort($broadsheetData, fn($a, $b) => $b['average'] <=> $a['average']);

        $rank = 1;
        foreach ($broadsheetData as $idx => &$data) {
            if ($idx > 0 && $data['average'] < $broadsheetData[$idx - 1]['average']) {
                $rank = $idx + 1;
            }
            $data['class_position'] = $rank;
            $data['class_position_formatted'] = GradingService::ordinal($rank);
        }

        return response()->json([
            'school' => $settings,
            'class' => $schoolClass,
            'term' => $term,
            'session' => $session,
            'subjects' => $subjects,
            'broadsheet' => $broadsheetData,
        ], 200);
    }

    /**
     * Generate Comprehensive Student Report Card with QR Verification Hash & Fee Gatekeeper Check
    /**
     * Generate Comprehensive Student Report Card with QR Verification Hash, QR Graphic & Fee Gatekeeper Check.
     */
    public function generateReportCard(Request $request, $studentId)
    {
        $term = $request->query('term', '1st Term');
        $session = $request->query('session', '2025/2026');

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

        // Fetch student's approved subject results for the report card
        $results = Result::where('student_id', $student->id)
            ->where('term', $term)
            ->where('academic_session', $session)
            ->where(function ($query) {
                $query->where('approval_status', 'approved')
                      ->orWhere('status', 'approved');
            })
            ->with('subject')
            ->get();

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
