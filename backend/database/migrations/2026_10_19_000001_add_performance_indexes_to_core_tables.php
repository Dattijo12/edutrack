<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations to add composite performance indexes to core high-volume tables.
     */
    public function up(): void
    {
        // 1. Results / Scores table indexes
        if (Schema::hasTable('results')) {
            Schema::table('results', function (Blueprint $table) {
                // Ensure result_window_id column exists before indexing
                if (!Schema::hasColumn('results', 'result_window_id')) {
                    $table->foreignId('result_window_id')
                        ->nullable()
                        ->after('term_id')
                        ->constrained('result_windows')
                        ->nullOnDelete();
                }

                $table->index(['result_window_id', 'class_id', 'subject_id'], 'results_window_class_subject_idx');
                $table->index(['student_id', 'result_window_id'], 'results_student_window_idx');
            });
        }

        if (Schema::hasTable('scores')) {
            Schema::table('scores', function (Blueprint $table) {
                if (!Schema::hasColumn('scores', 'result_window_id')) {
                    $table->foreignId('result_window_id')->nullable()->constrained('result_windows')->nullOnDelete();
                }
                $table->index(['result_window_id', 'class_id', 'subject_id'], 'scores_window_class_subject_idx');
                $table->index(['student_id', 'result_window_id'], 'scores_student_window_idx');
            });
        }

        // 2. Attendances table composite index
        if (Schema::hasTable('attendances')) {
            Schema::table('attendances', function (Blueprint $table) {
                $table->index(['class_id', 'date'], 'attendances_class_date_idx');
            });
        }

        // 3. Fee Payments table composite indexes
        if (Schema::hasTable('fee_payments')) {
            Schema::table('fee_payments', function (Blueprint $table) {
                $table->index(['term_id', 'payment_status'], 'fee_payments_term_status_idx');
                $table->index(['student_id', 'term_id'], 'fee_payments_student_term_idx');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('results')) {
            Schema::table('results', function (Blueprint $table) {
                $table->dropIndex('results_window_class_subject_idx');
                $table->dropIndex('results_student_window_idx');
                if (Schema::hasColumn('results', 'result_window_id')) {
                    $table->dropForeign(['result_window_id']);
                    $table->dropColumn('result_window_id');
                }
            });
        }

        if (Schema::hasTable('scores')) {
            Schema::table('scores', function (Blueprint $table) {
                $table->dropIndex('scores_window_class_subject_idx');
                $table->dropIndex('scores_student_window_idx');
            });
        }

        if (Schema::hasTable('attendances')) {
            Schema::table('attendances', function (Blueprint $table) {
                $table->dropIndex('attendances_class_date_idx');
            });
        }

        if (Schema::hasTable('fee_payments')) {
            Schema::table('fee_payments', function (Blueprint $table) {
                $table->dropIndex('fee_payments_term_status_idx');
                $table->dropIndex('fee_payments_student_term_idx');
            });
        }
    }
};
