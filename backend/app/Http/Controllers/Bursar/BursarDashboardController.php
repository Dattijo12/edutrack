<?php

namespace App\Http\Controllers\Bursar;

use App\Http\Controllers\Controller;
use App\Models\AcademicTerm;
use App\Models\FeePayment;
use App\Models\SchoolSetting;

class BursarDashboardController extends Controller
{
    /**
     * Return aggregated financial stats for the Bursar dashboard.
     *
     * Automatically determines the active academic term from either the
     * school settings or the AcademicTerm flag, then queries fee_payments
     * for the matching term_id.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getStats()
    {
        // Resolve the currently active academic term
        $activeTerm = AcademicTerm::where('is_current', true)->first();

        // Fallback: use school settings if no AcademicTerm is flagged as current
        if (!$activeTerm) {
            $settings = SchoolSetting::first();
            if ($settings) {
                $activeTerm = AcademicTerm::where('session', $settings->active_session)
                    ->where('term', $settings->active_term)
                    ->first();
            }
        }

        if (!$activeTerm) {
            return response()->json([
                'total_collections'    => 0,
                'pending_debts_count'  => 0,
                'active_session'       => null,
                'active_term'          => null,
            ]);
        }

        // Total collections: SUM of all amount_paid for the active term
        $totalCollections = FeePayment::where('term_id', $activeTerm->id)
            ->sum('amount_paid');

        // Pending debts: COUNT of students who have not fully paid (status != 'paid')
        $pendingDebtsCount = FeePayment::where('term_id', $activeTerm->id)
            ->where('payment_status', '!=', 'paid')
            ->count();

        return response()->json([
            'total_collections'    => round((float) $totalCollections, 2),
            'pending_debts_count'  => $pendingDebtsCount,
            'active_session'       => $activeTerm->session,
            'active_term'          => $activeTerm->term,
        ]);
    }
}
