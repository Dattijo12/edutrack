<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class SchoolClass extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'classes';

    protected $fillable = [
        'name',
        'arm',
        'form_master_id',
    ];

    public function formMaster()
    {
        return $this->belongsTo(User::class, 'form_master_id');
    }

    public function students()
    {
        return $this->hasMany(Student::class, 'class_id');
    }

    public function subjectAssignments()
    {
        return $this->hasMany(SubjectAssignment::class, 'class_id');
    }
}
