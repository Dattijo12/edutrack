<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create the audit_logs table for the System Audit Trail module.
     *
     * Stores a chronological record of every significant action performed
     * within the School Management System — including logins, grade changes,
     * deletions, and configuration updates — for compliance and traceability.
     */
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();

            // The staff user who performed the action (nullable for system-driven events)
            $table->foreignId('user_id')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            // Short machine-readable action label (e.g., 'login', 'grade_updated', 'student_deleted')
            $table->string('action');

            // Detailed human-readable description of what happened
            $table->text('description');

            // Polymorphic reference to the specific record that was altered
            $table->nullableMorphs('target');

            // Request metadata for forensic traceability
            $table->string('ip_address')->nullable();
            $table->string('user_agent')->nullable();

            $table->timestamps();

            // Index for fast filtering by action type and chronological ordering
            $table->index(['action', 'created_at']);
        });
    }

    /**
     * Reverse the migration.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
