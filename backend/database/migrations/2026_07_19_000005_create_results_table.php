<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('results', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignId('subject_id')->constrained('subjects')->onDelete('cascade');
            $table->foreignId('class_id')->nullable()->constrained('classes')->onDelete('cascade');
            $table->foreignId('teacher_id')->constrained('users')->onDelete('restrict');
            
            $table->decimal('ca_score', 5, 2)->default(0.00);
            $table->decimal('exam_score', 5, 2)->default(0.00);
            $table->decimal('total_score', 5, 2)->default(0.00);
            $table->string('grade', 3)->nullable(); // A1, B2, B3, C4, C5, C6, D7, E8, F9
            $table->string('remark')->nullable();
            $table->integer('subject_position')->nullable();
            
            $table->string('term'); // e.g. "1st Term", "2nd Term", "3rd Term"
            $table->string('academic_session'); // e.g. "2025/2026"
            $table->foreignId('term_id')->nullable();
            $table->enum('approval_status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->string('verification_hash')->nullable();
            
            $table->softDeletes();
            $table->timestamps();

            $table->unique(['student_id', 'subject_id', 'term', 'academic_session'], 'student_subject_term_session_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('results');
    }
};
