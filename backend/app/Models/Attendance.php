<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'student_id',
        'class_id',
        'date',
        'status',
        'remark',
        'marked_by',
    ];

    /**
     * Get the student associated with the attendance record.
     */
    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    /**
     * Get the class associated with the attendance record.
     */
    public function schoolClass()
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    /**
     * Get the user (Form Master/Teacher) who marked the attendance.
     */
    public function markedBy()
    {
        return $this->belongsTo(User::class, 'marked_by');
    }
}
