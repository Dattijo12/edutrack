<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table) {
            $table->id();
            $table->string('admission_number')->unique();
            $table->string('first_name');
            $table->string('last_name');
            $table->foreignId('class_id')->constrained('classes')->onDelete('restrict');
            $table->enum('gender', ['Male', 'Female'])->default('Male');
            $table->string('guardian_phone')->nullable();
            $table->boolean('fee_cleared_status')->default(true);
            $table->string('photo_path')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};
