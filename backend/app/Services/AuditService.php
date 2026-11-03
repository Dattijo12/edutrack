<?php

namespace App\Services;

use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditService
{
    /**
     * Record an audit log entry.
     *
     * Automatically captures the authenticated user (from any guard),
     * the client IP address, and user-agent string from the current request.
     *
     * @param  string      $action       Machine-readable action label (e.g., 'login', 'grade_updated')
     * @param  string      $description  Human-readable summary of what happened
     * @param  Model|null  $target       The Eloquent model instance that was affected (optional)
     * @return AuditLog
     */
    public static function log(string $action, string $description, ?Model $target = null): AuditLog
    {
        // Resolve the authenticated user from the default guard or the student guard
        $userId = Auth::id() ?? Auth::guard('student')->id();

        return AuditLog::create([
            'user_id'     => $userId,
            'action'      => $action,
            'description' => $description,
            'target_type' => $target ? get_class($target) : null,
            'target_id'   => $target?->getKey(),
            'ip_address'  => Request::ip(),
            'user_agent'  => Request::userAgent(),
        ]);
    }
}
