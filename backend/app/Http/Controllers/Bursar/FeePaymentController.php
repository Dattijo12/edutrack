<?php

namespace App\Http\Controllers\Bursar;

use App\Http\Controllers\Controller;
use App\Models\FeePayment;
use App\Models\Student;
use App\Models\AcademicTerm;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FeePaymentController extends Controller
{
    public function index(Request $request)
    {
        $query = Student::with(['class', 'feePayments.academicTerm']);

        if ($request->has('class_id') && !empty($request->class_id)) {
            $query->where('class_id', $request->class_id);
        }

        if ($request->has('status') && $request->status !== 'all') {
            if ($request->status === 'cleared') {
                $query->where('fee_cleared_status', true);
            } elseif ($request->status === 'owing') {
                $query->where('fee_cleared_status', false);
            }
        }

        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('admission_number', 'like', "%{$search}%");
            });
        }

        return response()->json($query->orderBy('first_name')->get(), 200);
    }

    public function recordPayment(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'term_id' => 'required|exists:academic_terms,id',
            'amount_due' => 'required|numeric|min:0',
            'amount_paid' => 'required|numeric|min:0',
        ]);

        $student = Student::findOrFail($validated['student_id']);
        $balance = max(0, $validated['amount_due'] - $validated['amount_paid']);
        $paymentStatus = ($balance <= 0) ? 'paid' : (($validated['amount_paid'] > 0) ? 'partial' : 'owing');

        $payment = FeePayment::firstOrNew([
            'student_id' => $validated['student_id'],
            'term_id' => $validated['term_id'],
        ]);

        $auditTrail = json_decode($payment->audit_trail ?? '[]', true);
        $auditTrail[] = [
            'date' => date('Y-m-d H:i:s'),
            'amount_paid' => $validated['amount_paid'],
            'amount_due' => $validated['amount_due'],
            'balance' => $balance,
            'status' => $paymentStatus,
            'recorded_by' => auth()->user()->name,
        ];

        $payment->amount_due = $validated['amount_due'];
        $payment->amount_paid = $validated['amount_paid'];
        $payment->balance = $balance;
        $payment->payment_status = $paymentStatus;
        $payment->recorded_by = auth()->id();
        $payment->audit_trail = json_encode($auditTrail);
        $payment->save();

        // Automatically update student clearance status
        $student->fee_cleared_status = ($paymentStatus === 'paid');
        $student->save();

        return response()->json([
            'message' => 'Payment recorded successfully',
            'payment' => $payment,
            'student' => $student
        ], 200);
    }

    public function toggleClearance(Request $request, Student $student)
    {
        $validated = $request->validate([
            'fee_cleared_status' => 'required|boolean',
        ]);

        $student->fee_cleared_status = $validated['fee_cleared_status'];
        $student->save();

        return response()->json([
            'message' => 'Student fee clearance status updated successfully',
            'student' => $student
        ], 200);
    }
}
