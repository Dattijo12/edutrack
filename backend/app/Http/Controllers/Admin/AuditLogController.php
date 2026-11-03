<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    /**
     * Return a paginated, filterable list of audit log entries.
     *
     * Supported query parameters:
     *  - action    : filter by exact action label (e.g., 'login', 'grade_updated')
     *  - user_id   : filter by the staff user who performed the action
     *  - search    : free-text search across description, action, and user name
     *  - date_from : only entries on or after this date (Y-m-d)
     *  - date_to   : only entries on or before this date (Y-m-d)
     *  - per_page  : number of results per page (default 25, max 100)
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $query = AuditLog::with('user:id,name,role,email');

        // Filter by exact action label
        $query->when($request->filled('action'), function ($q) use ($request) {
            $q->where('action', $request->action);
        });

        // Filter by specific user
        $query->when($request->filled('user_id'), function ($q) use ($request) {
            $q->where('user_id', $request->user_id);
        });

        // Free-text search across description, action, and related user name
        $query->when($request->filled('search'), function ($q) use ($request) {
            $search = $request->search;
            $q->where(function ($sub) use ($search) {
                $sub->where('description', 'like', "%{$search}%")
                    ->orWhere('action', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%");
                    });
            });
        });

        // Date range filters
        $query->when($request->filled('date_from'), function ($q) use ($request) {
            $q->whereDate('created_at', '>=', $request->date_from);
        });

        $query->when($request->filled('date_to'), function ($q) use ($request) {
            $q->whereDate('created_at', '<=', $request->date_to);
        });

        // Order newest first and paginate
        $perPage = min((int) ($request->per_page ?? 25), 100);
        $logs = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json($logs);
    }

    /**
     * Return distinct action labels for the frontend filter dropdown.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function actions()
    {
        $actions = AuditLog::select('action')
            ->distinct()
            ->orderBy('action')
            ->pluck('action');

        return response()->json($actions);
    }
}
