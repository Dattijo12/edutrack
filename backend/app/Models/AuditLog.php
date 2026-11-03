<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    use HasFactory;

    /**
     * Mass-assignable attributes for audit log entries.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'action',
        'description',
        'target_type',
        'target_id',
        'ip_address',
        'user_agent',
    ];

    /**
     * The staff user who performed the audited action.
     * Nullable — some events may be system-driven (e.g., scheduled jobs).
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Polymorphic relationship to the specific record that was altered
     * (e.g., a Student, Result, SchoolClass, or User instance).
     */
    public function target()
    {
        return $this->morphTo();
    }
}
