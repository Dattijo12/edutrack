<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('term_summaries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignId('class_id')->constrained('classes')->onDelete('cascade');
            $table->foreignId('term_id')->constrained('academic_terms')->onDelete('cascade');
            $table->decimal('total_marks', 7, 2)->default(0.00);
            $table->decimal('average', 5, 2)->default(0.00);
            $table->integer('class_position')->nullable();
            $table->text('form_master_remark')->nullable();
            $table->text('principal_remark')->nullable();
            $table->integer('attendance_present')->default(0);
            $table->integer('attendance_total')->default(0);
            $table->softDeletes();
            $table->timestamps();

            $table->unique(['student_id', 'class_id', 'term_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('term_summaries');
    }
};
