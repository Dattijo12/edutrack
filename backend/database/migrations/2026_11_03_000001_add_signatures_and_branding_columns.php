<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Add branding, motto, principal name, and official stamp to school_settings
        Schema::table('school_settings', function (Blueprint $table) {
            if (!Schema::hasColumn('school_settings', 'motto')) {
                $table->string('motto')->nullable()->after('name');
            }
            if (!Schema::hasColumn('school_settings', 'principal_name')) {
                $table->string('principal_name')->nullable()->after('email');
            }
            if (!Schema::hasColumn('school_settings', 'stamp_path')) {
                $table->string('stamp_path')->nullable()->after('principal_signature_path');
            }
        });

        // 2. Add signature_path to users table for Form Masters and teaching staff
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'signature_path')) {
                $table->string('signature_path')->nullable()->after('gender');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('school_settings', function (Blueprint $table) {
            $table->dropColumn(['motto', 'principal_name', 'stamp_path']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['signature_path']);
        });
    }
};
