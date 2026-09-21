<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations to add grade boundary columns to school_settings table.
     */
    public function up(): void
    {
        Schema::table('school_settings', function (Blueprint $table) {
            if (!Schema::hasColumn('school_settings', 'grade_a_min')) {
                $table->integer('grade_a_min')->default(70)->after('max_exam_score');
            }
            if (!Schema::hasColumn('school_settings', 'grade_b_min')) {
                $table->integer('grade_b_min')->default(60)->after('grade_a_min');
            }
            if (!Schema::hasColumn('school_settings', 'grade_c_min')) {
                $table->integer('grade_c_min')->default(50)->after('grade_b_min');
            }
            if (!Schema::hasColumn('school_settings', 'grade_d_min')) {
                $table->integer('grade_d_min')->default(45)->after('grade_c_min');
            }
            if (!Schema::hasColumn('school_settings', 'grade_e_min')) {
                $table->integer('grade_e_min')->default(40)->after('grade_d_min');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('school_settings', function (Blueprint $table) {
            $columnsToDrop = [];
            if (Schema::hasColumn('school_settings', 'grade_a_min')) {
                $columnsToDrop[] = 'grade_a_min';
            }
            if (Schema::hasColumn('school_settings', 'grade_b_min')) {
                $columnsToDrop[] = 'grade_b_min';
            }
            if (Schema::hasColumn('school_settings', 'grade_c_min')) {
                $columnsToDrop[] = 'grade_c_min';
            }
            if (Schema::hasColumn('school_settings', 'grade_d_min')) {
                $columnsToDrop[] = 'grade_d_min';
            }
            if (Schema::hasColumn('school_settings', 'grade_e_min')) {
                $columnsToDrop[] = 'grade_e_min';
            }

            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
