<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        // Support backward-compatibility if request passes email/phone instead of login_id
        if (!$request->has('login_id') && ($request->has('email') || $request->has('phone'))) {
            $request->merge(['login_id' => $request->input('email') ?? $request->input('phone')]);
        }

        $request->validate([
            'login_id' => 'required|string',
            'password' => 'required|string',
        ]);

        $loginId = trim($request->login_id);

        // Debug: Check if user exists
        $user = User::where('email', $loginId)
                    ->orWhere('phone', $loginId)
                    ->first();

        if (!$user) {
            return response()->json([
                'message' => 'DEBUG: User not found in database for ID: ' . $loginId
            ], 401);
        }

        // Debug: Check password match
        if (!Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'DEBUG: Password mismatch for user phone: ' . $user->phone
            ], 401);
        }

        if ($user->status === 'inactive') {
            return response()->json([
                'message' => 'Account is inactive. Please contact the administrator.'
            ], 403);
        }

        // Generate Sanctum token
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'status' => $user->status,
            ]
        ], 200);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully'
        ], 200);
    }

    public function profile(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'status' => $user->status,
            ]
        ], 200);
    }

    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Your current password does not match our records.'],
            ]);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json([
            'message' => 'Password updated successfully'
        ], 200);
    }
}
