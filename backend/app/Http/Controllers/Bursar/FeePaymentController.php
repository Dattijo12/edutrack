<?php

namespace App\Http\Controllers\Bursar;

use App\Http\Controllers\Controller;
use App\Models\FeePayment;
use App\Models\Student;
use App\Models\AcademicTerm;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

use App\Services\AuditService;

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

        $actingUser = auth()->user();
        $student = Student::findOrFail($validated['student_id']);
        $balance = max(0, $validated['amount_due'] - $validated['amount_paid']);
        $paymentStatus = ($balance <= 0) ? 'paid' : (($validated['amount_paid'] > 0) ? 'partial' : 'owing');

        $payment = DB::transaction(function () use ($validated, $student, $balance, $paymentStatus, $actingUser) {
            $paymentRecord = FeePayment::firstOrNew([
                'student_id' => $validated['student_id'],
                'term_id' => $validated['term_id'],
            ]);

            $previousStatus = $paymentRecord->exists ? $paymentRecord->payment_status : 'owing';

            $auditTrail = json_decode($paymentRecord->audit_trail ?? '[]', true);
            $auditTrail[] = [
                'date' => date('Y-m-d H:i:s'),
                'amount_paid' => $validated['amount_paid'],
                'amount_due' => $validated['amount_due'],
                'balance' => $balance,
                'status' => $paymentStatus,
                'recorded_by' => $actingUser ? $actingUser->name : 'System',
            ];

            $paymentRecord->amount_due = $validated['amount_due'];
            $paymentRecord->amount_paid = $validated['amount_paid'];
            $paymentRecord->balance = $balance;
            $paymentRecord->payment_status = $paymentStatus;
            $paymentRecord->recorded_by = $actingUser ? $actingUser->id : null;
            $paymentRecord->audit_trail = json_encode($auditTrail);
            $paymentRecord->save();

            // Automatically update student clearance status
            $student->fee_cleared_status = ($paymentStatus === 'paid');
            $student->save();

            // Financial Audit Trail Logging
            $userName = $actingUser ? "{$actingUser->name} ({$actingUser->role})" : 'System';
            AuditService::log(
                'fee_payment_recorded',
                "Fee payment of ₦{$validated['amount_paid']} recorded for student ID {$student->id} ({$student->name}). Amount due: ₦{$validated['amount_due']}, Balance: ₦{$balance}. Status transitioned from '{$previousStatus}' to '{$paymentStatus}' by {$userName}.",
                $paymentRecord
            );

            return $paymentRecord;
        });

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

        $actingUser = auth()->user();
        $previousStatus = $student->fee_cleared_status ? 'cleared' : 'owing';
        $newStatus = $validated['fee_cleared_status'] ? 'cleared' : 'owing';

        DB::transaction(function () use ($student, $validated, $previousStatus, $newStatus, $actingUser) {
            $student->fee_cleared_status = $validated['fee_cleared_status'];
            $student->save();

            $userName = $actingUser ? "{$actingUser->name} ({$actingUser->role})" : 'System';
            AuditService::log(
                'fee_clearance_updated',
                "Fee clearance status updated from '{$previousStatus}' to '{$newStatus}' for student ID {$student->id} ({$student->name}) by {$userName}.",
                $student
            );
        });

        return response()->json([
            'message' => 'Student fee clearance status updated successfully',
            'student' => $student
        ], 200);
    }
}
