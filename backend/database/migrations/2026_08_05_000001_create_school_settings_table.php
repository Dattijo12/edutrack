<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('school_settings', function (Blueprint $table) {
            $table->id();
            $table->string('name')->default('EduTrack Academy');
            $table->string('address')->default('123 Education Way, Victoria Island, Lagos');
            $table->string('phone')->default('+234 801 234 5678');
            $table->string('email')->default('info@edutrack.edu.ng');
            $table->string('logo_path')->nullable();
            $table->string('principal_signature_path')->nullable();
            $table->decimal('max_ca_score', 5, 2)->default(30.00);
            $table->decimal('max_exam_score', 5, 2)->default(70.00);
            $table->integer('grade_a_min')->default(70);
            $table->integer('grade_b_min')->default(60);
            $table->integer('grade_c_min')->default(50);
            $table->integer('grade_d_min')->default(45);
            $table->integer('grade_e_min')->default(40);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('school_settings');
    }
};
