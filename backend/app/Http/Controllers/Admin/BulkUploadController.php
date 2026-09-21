<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Student;
use App\Models\Result;
use App\Services\GradingService;

class BulkUploadController extends Controller
{
    public function uploadStudents(Request $request)
    {
        $studentsData = $request->json('students', []);
        
        $inserted = 0;
        $skipped = [];
        $total = count($studentsData);

        foreach ($studentsData as $data) {
            $exists = Student::where('admission_number', $data['admission_number'])->exists();
            
            if ($exists) {
                $skipped[] = [
                    'admission_number' => $data['admission_number'],
                    'reason' => 'Admission number already exists.'
                ];
                continue;
            }
            
            $nameParts = explode(' ', $data['name'] ?? '', 2);
            $firstName = $nameParts[0];
            $lastName = $nameParts[1] ?? '';

            Student::create([
                'first_name' => $firstName,
                'last_name' => $lastName,
                'admission_number' => $data['admission_number'],
                'gender' => $data['gender'] ?? null,
                'dob' => $data['dob'] ?? null,
                'class_id' => $data['class_id'],
                'parent_phone' => $data['parent_phone'] ?? null,
            ]);
            
            $inserted++;
        }
        
        return response()->json([
            'inserted' => $inserted,
            'skipped' => $skipped,
            'total' => $total,
        ], 200);
    }
    
    public function uploadResults(Request $request)
    {
        $resultsData = $request->json('results', []);
        
        $upserted = 0;
        $errors = [];
        
        foreach ($resultsData as $data) {
            $student = Student::where('admission_number', $data['admission_number'])->first();
            
            if (!$student) {
                $errors[] = [
                    'admission_number' => $data['admission_number'],
                    'reason' => 'Student not found.'
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
        }
        
        return response()->json([
            'upserted' => $upserted,
            'errors' => $errors,
        ], 200);
    }
}
