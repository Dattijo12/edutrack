<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\Student;
use App\Models\SchoolSetting;
use App\Models\AcademicTerm;
use App\Models\SubjectAssignment;
use App\Models\FeePayment;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed School Settings
        SchoolSetting::firstOrCreate([], [
            'name' => 'EduTrack International Academy',
            'address' => '15 Education Boulevard, Victoria Island, Lagos, Nigeria',
            'phone' => '+234 802 345 6789',
            'email' => 'contact@edutrack.edu.ng',
            'max_ca_score' => 30.00,
            'max_exam_score' => 70.00,
        ]);

        // 2. Seed Academic Terms
        $term1 = AcademicTerm::firstOrCreate(
            ['session' => '2025/2026', 'term' => '1st Term'],
            ['is_current' => true]
        );
        AcademicTerm::firstOrCreate(
            ['session' => '2025/2026', 'term' => '2nd Term'],
            ['is_current' => false]
        );
        AcademicTerm::firstOrCreate(
            ['session' => '2025/2026', 'term' => '3rd Term'],
            ['is_current' => false]
        );

        // 3. Seed Users for All 5 RBAC Roles
        $admin = User::firstOrCreate(
            ['email' => 'admin@school.com'],
            [
                'name' => 'Dr. A. B. Danjuma (Principal)',
                'phone' => '+2348011111111',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
                'status' => 'active',
            ]
        );

        $examOfficer = User::firstOrCreate(
            ['email' => 'officer@school.com'],
            [
                'name' => 'Mrs. Folake Adebayo',
                'phone' => '+2348022222222',
                'password' => Hash::make('officer123'),
                'role' => 'exam_officer',
                'status' => 'active',
            ]
        );

        $bursar = User::firstOrCreate(
            ['email' => 'bursar@school.com'],
            [
                'name' => 'Mr. Emeka Nwosu',
                'phone' => '+2348033333333',
                'password' => Hash::make('bursar123'),
                'role' => 'bursar',
                'status' => 'active',
            ]
        );

        $formMaster = User::firstOrCreate(
            ['email' => 'formmaster@school.com'],
            [
                'name' => 'Mr. Ibrahim Garba',
                'phone' => '+2348044444444',
                'password' => Hash::make('master123'),
                'role' => 'form_master',
                'status' => 'active',
            ]
        );

        $teacher = User::firstOrCreate(
            ['email' => 'teacher@school.com'],
            [
                'name' => 'Mr. Samuel Oladipo',
                'phone' => '+2348055555555',
                'password' => Hash::make('teacher123'),
                'role' => 'teacher',
                'status' => 'active',
            ]
        );

        // 4. Seed Classes
        $classJSS1A = SchoolClass::firstOrCreate(
            ['name' => 'JSS 1', 'arm' => 'A'],
            ['form_master_id' => $formMaster->id]
        );
        $classJSS1B = SchoolClass::firstOrCreate(
            ['name' => 'JSS 1', 'arm' => 'B']
        );
        $classSS1A = SchoolClass::firstOrCreate(
            ['name' => 'SS 1', 'arm' => 'A']
        );

        // 5. Seed Subjects
        $math = Subject::firstOrCreate(['code' => 'MATH101'], ['name' => 'Mathematics', 'category' => 'Core']);
        $eng  = Subject::firstOrCreate(['code' => 'ENG101'],  ['name' => 'English Language', 'category' => 'Core']);
        $phy  = Subject::firstOrCreate(['code' => 'PHY101'],  ['name' => 'Physics', 'category' => 'Science']);
        $chm  = Subject::firstOrCreate(['code' => 'CHM101'],  ['name' => 'Chemistry', 'category' => 'Science']);
        $civ  = Subject::firstOrCreate(['code' => 'CIV101'],  ['name' => 'Civic Education', 'category' => 'Core']);

        // 6. Seed Subject Assignments for Teacher
        SubjectAssignment::firstOrCreate([
            'teacher_id' => $teacher->id,
            'class_id' => $classJSS1A->id,
            'subject_id' => $math->id,
        ]);
        SubjectAssignment::firstOrCreate([
            'teacher_id' => $teacher->id,
            'class_id' => $classJSS1A->id,
            'subject_id' => $eng->id,
        ]);
        SubjectAssignment::firstOrCreate([
            'teacher_id' => $teacher->id,
            'class_id' => $classSS1A->id,
            'subject_id' => $phy->id,
        ]);

        // 7. Seed Students with Fee Clearance Statuses
        $stu1 = Student::firstOrCreate(
            ['admission_number' => 'STU2025/001'],
            [
                'first_name' => 'Chinedu',
                'last_name' => 'Okonkwo',
                'class_id' => $classJSS1A->id,
                'gender' => 'Male',
                'guardian_phone' => '+2348031234567',
                'fee_cleared_status' => true,
            ]
        );

        $stu2 = Student::firstOrCreate(
            ['admission_number' => 'STU2025/002'],
            [
                'first_name' => 'Amina',
                'last_name' => 'Bello',
                'class_id' => $classJSS1A->id,
                'gender' => 'Female',
                'guardian_phone' => '+2348041234567',
                'fee_cleared_status' => true,
            ]
        );

        $stu3 = Student::firstOrCreate(
            ['admission_number' => 'STU2025/003'],
            [
                'first_name' => 'Tunde',
                'last_name' => 'Bakare',
                'class_id' => $classJSS1A->id,
                'gender' => 'Male',
                'guardian_phone' => '+2348051234567',
                'fee_cleared_status' => false, // OWING FEES! Gatekeeping test
            ]
        );

        $stu4 = Student::firstOrCreate(
            ['admission_number' => 'STU2025/004'],
            [
                'first_name' => 'Grace',
                'last_name' => 'Eze',
                'class_id' => $classSS1A->id,
                'gender' => 'Female',
                'guardian_phone' => '+2348061234567',
                'fee_cleared_status' => true,
            ]
        );

        // 8. Seed Fee Payments
        FeePayment::firstOrCreate(
            ['student_id' => $stu1->id, 'term_id' => $term1->id],
            [
                'amount_due' => 150000.00,
                'amount_paid' => 150000.00,
                'balance' => 0.00,
                'payment_status' => 'paid',
                'recorded_by' => $bursar->id,
                'audit_trail' => json_encode([
                    ['date' => date('Y-m-d H:i:s'), 'action' => 'Full Payment Recorded', 'amount' => 150000.00, 'by' => $bursar->name]
                ])
            ]
        );

        FeePayment::firstOrCreate(
            ['student_id' => $stu3->id, 'term_id' => $term1->id],
            [
                'amount_due' => 150000.00,
                'amount_paid' => 50000.00,
                'balance' => 100000.00,
                'payment_status' => 'owing',
                'recorded_by' => $bursar->id,
                'audit_trail' => json_encode([
                    ['date' => date('Y-m-d H:i:s'), 'action' => 'Partial Payment Recorded', 'amount' => 50000.00, 'by' => $bursar->name]
                ])
            ]
        );
    }
}
