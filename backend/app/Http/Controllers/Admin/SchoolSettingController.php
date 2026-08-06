<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SchoolSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

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
            'logo' => 'nullable|image|max:2048',
            'principal_signature' => 'nullable|image|max:2048',
        ]);

        if (((float) $validated['max_ca_score'] + (float) $validated['max_exam_score']) !== 100.0) {
            return response()->json([
                'message' => 'Max CA score and Max Exam score must add up to exactly 100.'
            ], 422);
        }

        $settings = SchoolSetting::firstOrCreate([], [
            'name' => 'EduTrack International Academy',
            'address' => '15 Education Boulevard, Victoria Island, Lagos, Nigeria',
            'phone' => '+234 802 345 6789',
            'email' => 'contact@edutrack.edu.ng',
            'max_ca_score' => 30.00,
            'max_exam_score' => 70.00,
        ]);

        if ($request->hasFile('logo')) {
            if ($settings->logo_path) {
                Storage::disk('public')->delete($settings->logo_path);
            }

            $validated['logo_path'] = $request->file('logo')->store('school-assets/logos', 'public');
        }

        if ($request->hasFile('principal_signature')) {
            if ($settings->principal_signature_path) {
                Storage::disk('public')->delete($settings->principal_signature_path);
            }

            $validated['principal_signature_path'] = $request->file('principal_signature')->store('school-assets/signatures', 'public');
        }

        unset($validated['logo'], $validated['principal_signature']);

        $settings->update($validated);
        $settings->refresh();

        return response()->json([
            'message' => 'School settings updated successfully',
            'data' => $settings
        ], 200);
    }
}
