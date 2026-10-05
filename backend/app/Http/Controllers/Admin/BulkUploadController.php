<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Student;
use App\Models\Result;
use App\Models\SchoolClass;
use App\Services\GradingService;

class BulkUploadController extends Controller
{
    public function uploadStudents(Request $request)
    {
        // Validate class_id is present and exists
        $request->validate([
            'class_id' => 'required|integer|exists:classes,id',
        ]);

        $classId = $request->input('class_id');
        $studentsData = $request->json('students', []);

        if (empty($studentsData)) {
            return response()->json([
                'message' => 'No student records provided.',
            ], 422);
        }

        $inserted = 0;
        $skipped = [];
        $errors = [];
        $total = count($studentsData);

        foreach ($studentsData as $index => $data) {
            try {
                // Validate required fields per row
                if (empty($data['admission_number'])) {
                    $errors[] = [
                        'row' => $index + 1,
                        'reason' => 'Missing admission number.',
                    ];
                    continue;
                }

                if (empty($data['name'])) {
                    $errors[] = [
                        'row' => $index + 1,
                        'admission_number' => $data['admission_number'] ?? 'N/A',
                        'reason' => 'Missing student name.',
                    ];
                    continue;
                }

                $exists = Student::where('admission_number', $data['admission_number'])->exists();

                if ($exists) {
                    $skipped[] = [
                        'row' => $index + 1,
                        'admission_number' => $data['admission_number'],
                        'reason' => 'Admission number already exists.',
                    ];
                    continue;
                }

                $nameParts = explode(' ', trim($data['name']), 2);
                $firstName = $nameParts[0];
                $lastName = $nameParts[1] ?? '';

                Student::create([
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'admission_number' => $data['admission_number'],
                    'gender' => $data['gender'] ?? null,
                    'dob' => $data['dob'] ?? null,
                    'class_id' => $classId,  // Use the single class_id from the request
                    'parent_phone' => $data['parent_phone'] ?? null,
                ]);

                $inserted++;
            } catch (\Exception $e) {
                $errors[] = [
                    'row' => $index + 1,
                    'admission_number' => $data['admission_number'] ?? 'N/A',
                    'reason' => $e->getMessage(),
                ];
            }
        }

        return response()->json([
            'inserted' => $inserted,
            'skipped' => count($skipped),
            'error' => count($errors),
            'total' => $total,
            'skipped_details' => $skipped,
            'error_details' => $errors,
        ], 200);
    }

    public function uploadResults(Request $request)
    {
        $resultsData = $request->json('results', []);

        if (empty($resultsData)) {
            return response()->json([
                'message' => 'No result records provided.',
            ], 422);
        }

        $upserted = 0;
        $errors = [];

        foreach ($resultsData as $index => $data) {
            try {
                $student = Student::where('admission_number', $data['admission_number'])->first();

                if (!$student) {
                    $errors[] = [
                        'row' => $index + 1,
                        'admission_number' => $data['admission_number'] ?? 'N/A',
                        'reason' => 'Student not found.',
                    ];
                    continue;
                }

                $caScore = (float)($data['ca_score'] ?? 0);
                $examScore = (float)($data['exam_score'] ?? 0);
                $totalScore = $caScore + $examScore;

                $gradeData = GradingService::calculateGrade($totalScore);
                $grade = $gradeData['grade'] ?? 'F9';

                Result::updateOrCreate(
                    [
                        'student_id' => $student->id,
                        'subject_id' => $data['subject_id'],
                        'term' => $data['term'],
                        'academic_session' => $data['academic_session'],
                    ],
                    [
                        'ca_score' => $caScore,
                        'exam_score' => $examScore,
                        'total_score' => $totalScore,
                        'grade' => $grade,
                        'teacher_id' => auth()->id(),
                    ]
                );

                $upserted++;
            } catch (\Exception $e) {
                $errors[] = [
                    'row' => $index + 1,
                    'admission_number' => $data['admission_number'] ?? 'N/A',
                    'reason' => $e->getMessage(),
                ];
            }
        }

        return response()->json([
            'upserted' => $upserted,
            'error' => count($errors),
            'error_details' => $errors,
        ], 200);
    }
}
