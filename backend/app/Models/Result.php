<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Result extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     * Includes scores, WAEC/NECO grades, approval status, rejection feedback reason, and verification hash.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'student_id',
        'subject_id',
        'class_id',
        'teacher_id',
        'ca_score',
        'exam_score',
        'total_score',
        'grade',
        'remark',
        'subject_position',
        'term',
        'academic_session',
        'approval_status',
        'status',
        'rejection_reason',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class);
    }

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
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
