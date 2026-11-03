<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations to add authentication fields to students and publication status to result_windows.
     */
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            if (!Schema::hasColumn('students', 'password')) {
                $table->string('password')->nullable()->after('gender');
            }
            if (!Schema::hasColumn('students', 'pin')) {
                $table->string('pin', 20)->nullable()->after('password');
            }
        });

        Schema::table('result_windows', function (Blueprint $table) {
            if (!Schema::hasColumn('result_windows', 'is_published')) {
                $table->boolean('is_published')->default(false)->after('is_open');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $cols = [];
            if (Schema::hasColumn('students', 'password')) $cols[] = 'password';
            if (Schema::hasColumn('students', 'pin')) $cols[] = 'pin';
            if (!empty($cols)) $table->dropColumn($cols);
        });

        Schema::table('result_windows', function (Blueprint $table) {
            if (Schema::hasColumn('result_windows', 'is_published')) {
                $table->dropColumn('is_published');
            }
        });
    }
};
