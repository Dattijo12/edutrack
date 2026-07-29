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
        Schema::create('results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignId('subject_id')->constrained('subjects')->onDelete('cascade');
            $table->foreignId('teacher_id')->constrained('users')->onDelete('restrict');
            
            $table->decimal('ca_score', 5, 2)->default(0.00);
            $table->decimal('exam_score', 5, 2)->default(0.00);
            $table->decimal('total_score', 5, 2)->default(0.00);
            $table->string('grade', 3)->nullable();
            
            $table->string('term'); // e.g. "First Term", "Second Term", etc.
            $table->string('academic_session'); // e.g. "2025/2026"
            $table->enum('approval_status', ['pending', 'approved', 'rejected'])->default('pending');
            
            $table->timestamps();

            // Composite unique constraint to prevent duplicate results
            $table->unique(['student_id', 'subject_id', 'term', 'academic_session'], 'student_subject_term_session_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('results');
    }
};
