<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Result;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\Student;
use App\Models\SubjectAssignment;
use App\Models\AcademicTerm;
use App\Services\GradingService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ResultController extends Controller
{
    public function index(Request $request)
    {
        $teacherId = $request->user()->id;

        $results = Result::where('teacher_id', $teacherId)
            ->with(['student.class', 'subject'])
            ->get();

        return response()->json($results, 200);
    }

    public function store(Request $request)
    {
        $maxScores = GradingService::getMaxScores();

        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'subject_id' => 'required|exists:subjects,id',
            'ca_score' => "required|numeric|min:0|max:{$maxScores['max_ca']}",
            'exam_score' => "required|numeric|min:0|max:{$maxScores['max_exam']}",
            'term' => 'required|string',
            'academic_session' => 'required|string',
        ]);

        $student = Student::findOrFail($validated['student_id']);

        // Calculate total score and WAEC/NECO grade & remark
        $totalScore = (float)$validated['ca_score'] + (float)$validated['exam_score'];
        $gradeInfo = GradingService::calculateGrade($totalScore);

        // Find or create the academic term to ensure term_id is populated
        $academicTerm = AcademicTerm::firstOrCreate([
            'session' => $validated['academic_session'],
            'term' => $validated['term'],
        ]);

        $result = Result::updateOrCreate(
            [
                'student_id' => $validated['student_id'],
                'subject_id' => $validated['subject_id'],
                'term' => $validated['term'],
                'academic_session' => $validated['academic_session'],
            ],
            [
                'class_id' => $student->class_id,
                'teacher_id' => $request->user()->id,
                'term_id' => $academicTerm->id,
                'ca_score' => $validated['ca_score'],
                'exam_score' => $validated['exam_score'],
                'total_score' => $totalScore,
                'grade' => $gradeInfo['grade'],
                'remark' => $gradeInfo['remark'],
                'approval_status' => 'pending',
                'status' => 'pending',
                'rejection_reason' => null,
                'verification_hash' => md5("EDUTRACK_{$validated['student_id']}_{$validated['term']}_{$validated['academic_session']}_VERIFIED"),
            ]
        );

        // Recalculate positions for this subject and class
        GradingService::updateSubjectPositions(
            $validated['subject_id'],
            $student->class_id,
            $validated['term'],
            $validated['academic_session']
        );

        return response()->json([
            'message' => 'Result recorded successfully',
            'data' => $result->load(['student.class', 'subject'])
        ], 201);
    }

    public function show(Request $request, Result $result)
    {
        return response()->json($result->load(['student.class', 'subject']), 200);
    }

    public function update(Request $request, Result $result)
    {
        if ($result->approval_status === 'approved' && !$request->user()->isAdmin()) {
            return response()->json(['message' => 'Cannot edit approved result.'], 422);
        }

        $maxScores = GradingService::getMaxScores();

        $validated = $request->validate([
            'ca_score' => "required|numeric|min:0|max:{$maxScores['max_ca']}",
            'exam_score' => "required|numeric|min:0|max:{$maxScores['max_exam']}",
        ]);

        $totalScore = (float)$validated['ca_score'] + (float)$validated['exam_score'];
        $gradeInfo = GradingService::calculateGrade($totalScore);

        // Explicitly force state reset on resubmission to clear rejection status from database
        $result->forceFill([
            'ca_score' => $validated['ca_score'],
            'exam_score' => $validated['exam_score'],
            'total_score' => $totalScore,
            'grade' => $gradeInfo['grade'],
            'remark' => $gradeInfo['remark'],
            'approval_status' => 'pending',
            'status' => 'pending',
            'rejection_reason' => null,
        ])->save();

        return response()->json([
            'message' => 'Result updated successfully',
            'data' => $result->load(['student.class', 'subject'])
        ], 200);
    }

    public function classes(Request $request)
    {
        $teacherId = $request->user()->id;

        if ($request->user()->isAdmin() || $request->user()->isExamOfficer()) {
            return response()->json(SchoolClass::all(), 200);
        }

        // Return only classes this teacher is assigned to via subject assignments
        $classIds = SubjectAssignment::where('teacher_id', $teacherId)->pluck('class_id')->unique();
        $classes = SchoolClass::whereIn('id', $classIds)->get();

        return response()->json($classes, 200);
    }

    public function subjects(Request $request)
    {
        $teacherId = $request->user()->id;

        if ($request->user()->isAdmin() || $request->user()->isExamOfficer()) {
            return response()->json(Subject::all(), 200);
        }

        // Return only subjects this teacher is assigned to
        $subjectIds = SubjectAssignment::where('teacher_id', $teacherId)->pluck('subject_id')->unique();
        $subjects = Subject::whereIn('id', $subjectIds)->get();

        return response()->json($subjects, 200);
    }

    public function students(Request $request)
    {
        $request->validate([
            'class_id' => 'required|exists:classes,id'
        ]);

        $students = Student::where('class_id', $request->class_id)->get();
        return response()->json($students, 200);
    }

    public function maxScores()
    {
        return response()->json(GradingService::getMaxScores(), 200);
    }

    /**
     * Get all results flagged for correction (rejected) for the logged-in teacher.
     */
    public function rejectedResults(Request $request)
    {
        $teacherId = $request->user()->id;

        $results = Result::where('teacher_id', $teacherId)
            ->where(function ($q) {
                $q->whereIn('approval_status', ['needs_correction', 'rejected'])
                  ->orWhere('status', 'rejected');
            })
            ->with(['student.class', 'subject', 'schoolClass'])
            ->get();

        return response()->json($results, 200);
    }

    /**
     * Generate and stream a downloadable CSV result entry template.
     * Contains exact headers: admission_number,student_name,ca_score,exam_score.
     */
    public function downloadTemplate(Request $request)
    {
        $classId = $request->query('class_id');
        $fileName = 'results_upload_template.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$fileName}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () use ($classId) {
            $file = fopen('php://output', 'w');
            // Standard exact headers required by W3/specification
            fputcsv($file, ['admission_number', 'student_name', 'ca_score', 'exam_score']);

            if ($classId) {
                $students = Student::where('class_id', $classId)->orderBy('last_name')->orderBy('first_name')->get();
                foreach ($students as $student) {
                    $fullName = $student->name
                        ?: trim(($student->first_name ?? '') . ' ' . ($student->last_name ?? ''));
                    fputcsv($file, [
                        $student->admission_number,
                        $fullName,
                        '', // Blank CA score for teacher input
                        '', // Blank Exam score for teacher input
                    ]);
                }
            } else {
                // Default sample template rows
                fputcsv($file, ['STD/2026/001', 'John Doe', '25', '65']);
                fputcsv($file, ['STD/2026/002', 'Jane Smith', '28', '58']);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Parse uploaded CSV file and upsert results with row-level error reporting.
     */
    public function bulkUpload(Request $request)
    {
        $request->validate([
            'file' => 'required|file|max:5120',
            'subject_id' => 'required|exists:subjects,id',
            'term' => 'required|string',
            'academic_session' => 'required|string',
        ]);

        $maxScores = GradingService::getMaxScores();
        $maxCa = $maxScores['max_ca'];
        $maxExam = $maxScores['max_exam'];

        $file = $request->file('file');
        $path = $file->getRealPath();
        $handle = fopen($path, 'r');

        if (!$handle) {
            return response()->json(['message' => 'Unable to read uploaded file.'], 422);
        }

        $header = fgetcsv($handle);
        if (!$header) {
            fclose($handle);
            return response()->json(['message' => 'Uploaded file is empty.'], 422);
        }

        // Clean headers: lowercase and trimmed
        $normalizedHeader = array_map(function ($col) {
            return strtolower(trim($col));
        }, $header);

        $admIdx = array_search('admission_number', $normalizedHeader);
        $caIdx = array_search('ca_score', $normalizedHeader);
        $examIdx = array_search('exam_score', $normalizedHeader);

        if ($admIdx === false || $caIdx === false || $examIdx === false) {
            fclose($handle);
            return response()->json([
                'message' => 'Invalid CSV headers. Missing required headers: admission_number, ca_score, exam_score.'
            ], 422);
        }

        $processedCount = 0;
        $errors = [];
        $rowNumber = 1; // Row 1 is header

        $academicTerm = AcademicTerm::firstOrCreate([
            'session' => $request->academic_session,
            'term' => $request->term,
        ]);

        while (($row = fgetcsv($handle)) !== false) {
            $rowNumber++;

            // Skip completely empty lines
            if (empty(array_filter($row))) {
                continue;
            }

            $admissionNumber = isset($row[$admIdx]) ? trim($row[$admIdx]) : '';
            $caRaw = isset($row[$caIdx]) ? trim($row[$caIdx]) : '';
            $examRaw = isset($row[$examIdx]) ? trim($row[$examIdx]) : '';

            if (empty($admissionNumber)) {
                $errors[] = "Row {$rowNumber}: Admission number is missing.";
                continue;
            }

            // Look up student by admission_number
            $student = Student::where('admission_number', $admissionNumber)->first();
            if (!$student) {
                $errors[] = "Row {$rowNumber} ({$admissionNumber}): Student with admission number '{$admissionNumber}' not found.";
                continue;
            }

            // Validate numeric scores
            if ($caRaw === '' || !is_numeric($caRaw)) {
                $errors[] = "Row {$rowNumber} ({$admissionNumber}): Invalid or missing CA score ('{$caRaw}').";
                continue;
            }

            if ($examRaw === '' || !is_numeric($examRaw)) {
                $errors[] = "Row {$rowNumber} ({$admissionNumber}): Invalid or missing Exam score ('{$examRaw}').";
                continue;
            }

            $caScore = (float)$caRaw;
            $examScore = (float)$examRaw;

            if ($caScore < 0 || $caScore > $maxCa) {
                $errors[] = "Row {$rowNumber} ({$admissionNumber}): CA score {$caScore} exceeds allowed range (0 - {$maxCa}).";
                continue;
            }

            if ($examScore < 0 || $examScore > $maxExam) {
                $errors[] = "Row {$rowNumber} ({$admissionNumber}): Exam score {$examScore} exceeds allowed range (0 - {$maxExam}).";
                continue;
            }

            $totalScore = $caScore + $examScore;
            $gradeInfo = GradingService::calculateGrade($totalScore);

            // Upsert result entry
            Result::updateOrCreate(
                [
                    'student_id' => $student->id,
                    'subject_id' => $request->subject_id,
                    'term' => $request->term,
                    'academic_session' => $request->academic_session,
                ],
                [
                    'class_id' => $student->class_id,
                    'teacher_id' => $request->user()->id,
                    'term_id' => $academicTerm->id,
                    'ca_score' => $caScore,
                    'exam_score' => $examScore,
                    'total_score' => $totalScore,
                    'grade' => $gradeInfo['grade'],
                    'remark' => $gradeInfo['remark'],
                    'approval_status' => 'pending',
                    'verification_hash' => md5("EDUTRACK_{$student->id}_{$request->term}_{$request->academic_session}_VERIFIED"),
                ]
            );

            // Recalculate subject positions for the class
            GradingService::updateSubjectPositions(
                $request->subject_id,
                $student->class_id,
                $request->term,
                $request->academic_session
            );

            $processedCount++;
        }

        fclose($handle);

        return response()->json([
            'message' => "Bulk upload finished: {$processedCount} record(s) saved successfully.",
            'processed_count' => $processedCount,
            'error_count' => count($errors),
            'errors' => $errors,
        ], 200);
    }
}
