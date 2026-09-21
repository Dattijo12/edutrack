<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations to add missing columns (dob, gender, parent_phone) to students table.
     */
    public function up(): void
    {
        Schema::table('students', function (Blueprint $table) {
            if (!Schema::hasColumn('students', 'gender')) {
                $table->string('gender', 20)->default('Male')->after('class_id');
            }
            if (!Schema::hasColumn('students', 'dob')) {
                $table->date('dob')->nullable()->after('gender');
            }
            if (!Schema::hasColumn('students', 'parent_phone')) {
                $table->string('parent_phone', 20)->nullable()->after('dob');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('students', function (Blueprint $table) {
            $columnsToDrop = [];
            if (Schema::hasColumn('students', 'dob')) {
                $columnsToDrop[] = 'dob';
            }
            if (Schema::hasColumn('students', 'parent_phone')) {
                $columnsToDrop[] = 'parent_phone';
            }
            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
