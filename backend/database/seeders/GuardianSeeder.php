<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Guardian;
use App\Models\Student;
use Illuminate\Support\Facades\Hash;

class GuardianSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Create or update dummy Guardian User
        $user = User::updateOrCreate(
            ['email' => 'guardian@test.com'],
            [
                'name' => 'Chief Robert Adeleke',
                'phone' => '08039876543',
                'password' => Hash::make('password'),
                'role' => 'guardian',
                'status' => 'active',
            ]
        );

        // 2. Create or update Guardian Profile linked to user
        $guardian = Guardian::updateOrCreate(
            ['user_id' => $user->id],
            [
                'name' => $user->name,
                'phone' => $user->phone,
                'address' => 'Plot 42, Admiralty Way, Lekki Phase 1, Lagos',
                'relationship' => 'Father',
            ]
        );

        // 3. Find first existing Student and link to this guardian
        $student = Student::first();

        if ($student) {
            $student->update([
                'guardian_id' => $guardian->id,
                'guardian_phone' => $guardian->phone,
            ]);
        }
    }
}
