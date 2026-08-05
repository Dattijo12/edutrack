<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fee_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->onDelete('cascade');
            $table->foreignId('term_id')->constrained('academic_terms')->onDelete('cascade');
            $table->decimal('amount_due', 10, 2)->default(0.00);
            $table->decimal('amount_paid', 10, 2)->default(0.00);
            $table->decimal('balance', 10, 2)->default(0.00);
            $table->enum('payment_status', ['paid', 'partial', 'owing'])->default('owing');
            $table->foreignId('recorded_by')->nullable()->constrained('users')->onDelete('set null');
            $table->text('audit_trail')->nullable(); // JSON formatted payment history logs
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fee_payments');
    }
};
