<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'gender',
        'password',
        'role',
        'status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isExamOfficer(): bool
    {
        return $this->role === 'exam_officer';
    }

    public function isBursar(): bool
    {
        return $this->role === 'bursar';
    }

    public function isFormMaster(): bool
    {
        return $this->role === 'form_master';
    }

    public function isTeacher(): bool
    {
        return $this->role === 'teacher';
    }

    public function results()
    {
        return $this->hasMany(Result::class, 'teacher_id');
    }

    public function subjectAssignments()
    {
        return $this->hasMany(SubjectAssignment::class, 'teacher_id');
    }

    public function assignedClasses()
    {
        return $this->hasMany(SchoolClass::class, 'form_master_id');
    }
}
