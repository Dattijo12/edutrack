<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SchoolSetting;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Controller for managing institutional metadata, dynamic scoring thresholds,
 * grade boundaries, and administrative authorization assets (logos, principal signatures, stamps).
 */
class SchoolSettingController extends Controller
{
    /**
     * Retrieve active school settings or initialize defaults.
     * Accessible by authenticated users, staff, and students.
     */
    public function show(): JsonResponse
    {
        $settings = SchoolSetting::firstOrCreate([], [
            'name'                     => 'EduTrack International Academy',
            'motto'                    => 'Excellence, Integrity and Discipline',
            'address'                  => '15 Education Boulevard, Victoria Island, Lagos, Nigeria',
            'phone'                    => '+234 802 345 6789',
            'email'                    => 'contact@edutrack.edu.ng',
            'principal_name'           => 'Dr. A. B. Danjuma (Principal)',
            'max_ca_score'             => 30.00,
            'max_exam_score'           => 70.00,
            'grade_a_min'              => 75,
            'grade_b_min'              => 65,
            'grade_c_min'              => 50,
            'grade_d_min'              => 40,
            'grade_e_min'              => 35,
        ]);

        return response()->json($settings, 200);
    }

    /**
     * Update institutional settings and upload official assets.
     * Restricted to school administrators and principals.
     */
    public function update(Request $request): JsonResponse
    {
        // Support field alias mapping if frontend sends school_* prefix
        if ($request->has('school_name') && !$request->has('name')) {
            $request->merge(['name' => $request->input('school_name')]);
        }
        if ($request->has('school_motto') && !$request->has('motto')) {
            $request->merge(['motto' => $request->input('school_motto')]);
        }
        if ($request->has('school_address') && !$request->has('address')) {
            $request->merge(['address' => $request->input('school_address')]);
        }
        if ($request->has('school_phone') && !$request->has('phone')) {
            $request->merge(['phone' => $request->input('school_phone')]);
        }
        if ($request->has('school_email') && !$request->has('email')) {
            $request->merge(['email' => $request->input('school_email')]);
        }

        $validated = $request->validate([
            'name'                => 'required|string|max:255',
            'motto'               => 'nullable|string|max:255',
            'address'             => 'required|string|max:500',
            'phone'               => 'required|string|max:50',
            'email'               => 'required|email|max:255',
            'principal_name'      => 'nullable|string|max:255',
            'max_ca_score'        => 'required|numeric|min:10|max:50',
            'max_exam_score'      => 'required|numeric|min:50|max:90',
            'grade_a_min'         => 'required|integer|min:0|max:100',
            'grade_b_min'         => 'required|integer|min:0|max:100',
            'grade_c_min'         => 'required|integer|min:0|max:100',
            'grade_d_min'         => 'required|integer|min:0|max:100',
            'grade_e_min'         => 'required|integer|min:0|max:100',
            'logo'                => 'nullable|image|mimes:png,jpg,jpeg,webp|max:2048',
            'school_logo'         => 'nullable|image|mimes:png,jpg,jpeg,webp|max:2048',
            'principal_signature' => 'nullable|image|mimes:png,jpg,jpeg,webp|max:2048',
            'stamp'               => 'nullable|image|mimes:png,jpg,jpeg,webp|max:2048',
            'school_stamp'        => 'nullable|image|mimes:png,jpg,jpeg,webp|max:2048',
        ]);

        if (((float) $validated['max_ca_score'] + (float) $validated['max_exam_score']) !== 100.0) {
            return response()->json([
                'message' => 'Max CA score and Max Exam score must add up to exactly 100.'
            ], 422);
        }

        $settings = SchoolSetting::firstOrCreate([], [
            'name'           => 'EduTrack International Academy',
            'motto'          => 'Excellence, Integrity and Discipline',
            'address'        => '15 Education Boulevard, Victoria Island, Lagos, Nigeria',
            'phone'          => '+234 802 345 6789',
            'email'          => 'contact@edutrack.edu.ng',
            'principal_name' => 'Dr. A. B. Danjuma (Principal)',
            'max_ca_score'   => 30.00,
            'max_exam_score' => 70.00,
            'grade_a_min'    => 75,
            'grade_b_min'    => 65,
            'grade_c_min'    => 50,
            'grade_d_min'    => 40,
            'grade_e_min'    => 35,
        ]);

        // Process School Logo Upload
        $logoFile = $request->file('logo') ?? $request->file('school_logo');
        if ($logoFile) {
            if ($settings->logo_path && Storage::disk('public')->exists($settings->logo_path)) {
                Storage::disk('public')->delete($settings->logo_path);
            }
            $validated['logo_path'] = $logoFile->store('school-assets/logos', 'public');
        }

        // Process Principal's Signature Upload
        if ($request->hasFile('principal_signature')) {
            if ($settings->principal_signature_path && Storage::disk('public')->exists($settings->principal_signature_path)) {
                Storage::disk('public')->delete($settings->principal_signature_path);
            }
            $validated['principal_signature_path'] = $request->file('principal_signature')->store('school-assets/signatures', 'public');
        }

        // Process Official School Stamp / Seal Upload
        $stampFile = $request->file('stamp') ?? $request->file('school_stamp');
        if ($stampFile) {
            if ($settings->stamp_path && Storage::disk('public')->exists($settings->stamp_path)) {
                Storage::disk('public')->delete($settings->stamp_path);
            }
            $validated['stamp_path'] = $stampFile->store('school-assets/stamps', 'public');
        }

        // Strip non-column file keys
        unset($validated['logo'], $validated['school_logo'], $validated['principal_signature'], $validated['stamp'], $validated['school_stamp']);

        DB::transaction(function () use ($settings, $validated) {
            $settings->update($validated);
        });

        $settings->refresh();

        // Audit Trail: record configuration change
        AuditService::log(
            'school_settings_updated',
            "Updated school configuration, branding assets, and authorization signatures.",
            $settings
        );

        return response()->json([
            'message' => 'School settings and branding updated successfully.',
            'data'    => $settings,
        ], 200);
    }
}
