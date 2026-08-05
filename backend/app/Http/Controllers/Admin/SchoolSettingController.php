<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SchoolSetting;
use Illuminate\Http\Request;

class SchoolSettingController extends Controller
{
    public function show()
    {
        $settings = SchoolSetting::firstOrCreate([], [
            'name' => 'EduTrack International Academy',
            'address' => '15 Education Boulevard, Victoria Island, Lagos, Nigeria',
            'phone' => '+234 802 345 6789',
            'email' => 'contact@edutrack.edu.ng',
            'max_ca_score' => 30.00,
            'max_exam_score' => 70.00,
        ]);

        return response()->json($settings, 200);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'required|string|max:500',
            'phone' => 'required|string|max:50',
            'email' => 'required|email|max:255',
            'max_ca_score' => 'required|numeric|min:10|max:50',
            'max_exam_score' => 'required|numeric|min:50|max:90',
        ]);

        $settings = SchoolSetting::first();
        if (!$settings) {
            $settings = SchoolSetting::create($validated);
        } else {
            $settings->update($validated);
        }

        return response()->json([
            'message' => 'School settings updated successfully',
            'data' => $settings
        ], 200);
    }
}
