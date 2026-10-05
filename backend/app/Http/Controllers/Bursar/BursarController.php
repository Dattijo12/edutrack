<?php

namespace App\Http\Controllers\Bursar;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Student;
use App\Models\SchoolClass;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class BursarController extends Controller
{
    /**
     * Fetch all school classes (id, name, arm) for Bursar dropdowns.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getClasses()
    {
        $classes = SchoolClass::select('id', 'name', 'arm')
            ->orderBy('name')
            ->orderBy('arm')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $classes,
        ], 200);
    }

    /**
     * Fetch students for a specific class (for cascading dropdown).
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function getStudentsByClass(Request $request)
    {
        $query = Student::with('class')->orderBy('first_name');

        if ($request->filled('class_id')) {
            $query->where('class_id', $request->class_id);
        }

        $students = $query->get();

        return response()->json([
            'status' => 'success',
            'data' => $students,
        ], 200);
    }

    /**
     * Fetch all payments, eager loading student and class details.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index()
    {
        $payments = Payment::with(['student.class'])
            ->latest()
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $payments,
        ], 200);
    }

    /**
     * Record a new student payment and update fee clearance status.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'amount_paid' => 'required|numeric|min:0.01',
            'term' => 'required|string',
            'academic_session' => 'required|string',
            'payment_method' => 'required|string',
            'reference_number' => 'nullable|string|unique:payments,reference_number',
            'status' => 'nullable|string',
        ]);

        $payment = DB::transaction(function () use ($validated) {
            // Auto-generate reference number if not provided
            if (empty($validated['reference_number'])) {
                $validated['reference_number'] = 'PAY-' . strtoupper(Str::random(10));
            }

            // Default status to 'completed' if not specified
            if (empty($validated['status'])) {
                $validated['status'] = 'completed';
            }

            // Record the payment
            $paymentRecord = Payment::create($validated);

            // Update student's fee clearance status to true upon payment
            $student = Student::find($validated['student_id']);
            if ($student) {
                $student->update([
                    'fee_cleared_status' => true,
                ]);
            }

            return $paymentRecord->load('student.class');
        });

        return response()->json([
            'message' => 'Payment recorded successfully.',
            'data' => $payment,
        ], 201);
    }
}
