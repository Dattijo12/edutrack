<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TermSummary extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'student_id',
        'class_id',
        'term_id',
        'total_marks',
        'average',
        'class_position',
        'form_master_remark',
        'principal_remark',
        'attendance_present',
        'attendance_total',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function schoolClass()
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function academicTerm()
    {
        return $this->belongsTo(AcademicTerm::class, 'term_id');
    }
}
