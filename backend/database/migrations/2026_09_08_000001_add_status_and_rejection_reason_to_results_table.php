<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations to add status and rejection_reason columns to results table.
     */
    public function up(): void
    {
        Schema::table('results', function (Blueprint $table) {
            if (!Schema::hasColumn('results', 'status')) {
                $table->string('status')->default('pending')->after('approval_status');
            }
            if (!Schema::hasColumn('results', 'rejection_reason')) {
                $table->text('rejection_reason')->nullable()->after('status');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('results', function (Blueprint $table) {
            $columnsToDrop = [];
            if (Schema::hasColumn('results', 'status')) {
                $columnsToDrop[] = 'status';
            }
            if (Schema::hasColumn('results', 'rejection_reason')) {
                $columnsToDrop[] = 'rejection_reason';
            }

            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
