<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('academic_terms', function (Blueprint $table) {
            $table->id();
            $table->string('session'); // e.g., "2025/2026"
            $table->string('term');    // e.g., "1st Term", "2nd Term", "3rd Term"
            $table->boolean('is_current')->default(false);
            $table->timestamps();

            $table->unique(['session', 'term']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('academic_terms');
    }
};
