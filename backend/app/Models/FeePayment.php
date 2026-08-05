<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class FeePayment extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'student_id',
        'term_id',
        'amount_due',
        'amount_paid',
        'balance',
        'payment_status',
        'recorded_by',
        'audit_trail',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function academicTerm()
    {
        return $this->belongsTo(AcademicTerm::class, 'term_id');
    }

    public function recorder()
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
