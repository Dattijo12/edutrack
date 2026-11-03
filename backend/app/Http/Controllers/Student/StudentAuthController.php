<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class StudentAuthController extends Controller
{
    /**
     * Authenticate student using admission_number and password (or PIN).
     * Returns a secure personal access token scoped to the student guard.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'admission_number' => 'required|string',
            'password' => 'required|string',
        ]);

        $admissionNumber = trim($validated['admission_number']);
        $password = trim($validated['password']);

        // Look up student by admission number (case-insensitive)
        $student = Student::with('class')
            ->whereRaw('LOWER(admission_number) = ?', [strtolower($admissionNumber)])
            ->first();

        if (!$student) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid admission number or password.',
            ], 401);
        }

        // Verify password or PIN
        $passwordMatches = false;

        if (!empty($student->password)) {
            $passwordMatches = Hash::check($password, $student->password);
        } elseif (!empty($student->pin)) {
            $passwordMatches = ($student->pin === $password) || Hash::check($password, $student->pin);
        } else {
            // Default credential fallback for new students: admission number, PIN 123456, or password
            $passwordMatches = (
                strtolower($password) === strtolower($student->admission_number) ||
                $password === '123456' ||
                $password === 'password' ||
                (!empty($student->dob) && $password === $student->dob)
            );

            // Automatically hash and save credential for future logins
            if ($passwordMatches) {
                $student->password = Hash::make($password);
                $student->save();
            }
        }

        if (!$passwordMatches) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid admission number or password.',
            ], 401);
        }

        // Revoke any previous student tokens to enforce single session security
        $student->tokens()->delete();

        // Create Sanctum access token specific to student scope
        $token = $student->createToken('student-access-token', ['role:student'])->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'Student authenticated successfully.',
            'token' => $token,
            'token_type' => 'Bearer',
            'student' => [
                'id' => $student->id,
                'name' => $student->name,
                'first_name' => $student->first_name,
                'last_name' => $student->last_name,
                'admission_number' => $student->admission_number,
                'gender' => $student->gender,
                'fee_cleared_status' => (bool)$student->fee_cleared_status,
                'photo_path' => $student->photo_path,
                'class' => $student->class ? [
                    'id' => $student->class->id,
                    'name' => $student->class->name,
                    'arm' => $student->class->arm ?? '',
                    'full_name' => trim("{$student->class->name} {$student->class->arm}"),
                ] : null,
            ]
        ], 200);
    }

    /**
     * Get authenticated student profile.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function profile(Request $request)
    {
        $user = $request->user();

        $student = ($user instanceof Student) 
            ? $user->load('class') 
            : Student::with('class')->find($user->id);

        if (!$student) {
            return response()->json(['message' => 'Student profile not found.'], 404);
        }

        return response()->json([
            'status' => 'success',
            'student' => $student,
        ], 200);
    }

    /**
     * Log out authenticated student and revoke token.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout(Request $request)
    {
        if ($request->user() && method_exists($request->user(), 'currentAccessToken')) {
            $request->user()->currentAccessToken()->delete();
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Logged out successfully.',
        ], 200);
    }
}
