<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\SchoolClass;
use App\Models\Subject;
use App\Models\Student;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed Admin user
        User::firstOrCreate(
            ['email' => 'admin@school.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
            ]
        );

        // Seed Teacher user
        User::firstOrCreate(
            ['email' => 'teacher@school.com'],
            [
                'name' => 'Teacher User',
                'password' => Hash::make('teacher123'),
                'role' => 'teacher',
            ]
        );

        // Seed Exam Officer user
        User::firstOrCreate(
            ['email' => 'officer@school.com'],
            [
                'name' => 'Exam Officer User',
                'password' => Hash::make('officer123'),
                'role' => 'exam_officer',
            ]
        );

        // Seed Classes
        $class10A = SchoolClass::firstOrCreate(['name' => 'Grade 10A']);
        $class11B = SchoolClass::firstOrCreate(['name' => 'Grade 11B']);
        $class12C = SchoolClass::firstOrCreate(['name' => 'Grade 12C']);

        // Seed Subjects
        Subject::firstOrCreate(['code' => 'MATH101'], ['name' => 'Mathematics']);
        Subject::firstOrCreate(['code' => 'ENG101'], ['name' => 'English Language']);
        Subject::firstOrCreate(['code' => 'PHY101'], ['name' => 'Physics']);
        Subject::firstOrCreate(['code' => 'CHM101'], ['name' => 'Chemistry']);

        // Seed Students
        Student::firstOrCreate(
            ['admission_number' => 'STU001'],
            [
                'name' => 'John Doe',
                'class_id' => $class10A->id
            ]
        );

        Student::firstOrCreate(
            ['admission_number' => 'STU002'],
            [
                'name' => 'Jane Smith',
                'class_id' => $class10A->id
            ]
        );

        Student::firstOrCreate(
            ['admission_number' => 'STU003'],
            [
                'name' => 'Michael Johnson',
                'class_id' => $class11B->id
            ]
        );
    }
}
