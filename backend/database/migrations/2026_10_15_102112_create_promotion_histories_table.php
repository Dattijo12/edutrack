<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create the promotion_histories table for the Student Promotion & Transition module.
     *
     * Records every class transition a student undergoes — promotions, repeats,
     * and graduations — linked to the specific result window (session/term)
     * during which the decision was made.
     */
    public function up(): void
    {
        Schema::create('promotion_histories', function (Blueprint $table) {
            $table->id();

            // The student who was promoted/repeated/graduated
            $table->foreignId('student_id')
                  ->constrained('students')
                  ->cascadeOnDelete();

            // The class the student was in before the transition (nullable for first enrollment)
            $table->foreignId('from_class_id')
                  ->nullable()
                  ->constrained('classes')
                  ->nullOnDelete();

            // The class the student moved into (nullable for graduation — no destination class)
            $table->foreignId('to_class_id')
                  ->nullable()
                  ->constrained('classes')
                  ->nullOnDelete();

            // The academic session/term window during which this promotion occurred
            $table->foreignId('result_window_id')
                  ->constrained('result_windows')
                  ->cascadeOnDelete();

            // Transition outcome: promoted, repeated, or graduated
            $table->string('status')->default('promoted');

            $table->timestamps();

            // Composite index: quickly look up a student's full promotion timeline
            $table->index(['student_id', 'created_at']);
        });
    }

    /**
     * Reverse the migration.
     */
    public function down(): void
    {
        Schema::dropIfExists('promotion_histories');
    }
};
