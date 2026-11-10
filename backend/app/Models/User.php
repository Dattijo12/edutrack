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
        'signature_path',
        'password',
        'role',
        'status',
    ];

    protected $appends = [
        'signature_url',
    ];

    public function getSignatureUrlAttribute(): ?string
    {
        return $this->signature_path ? asset('storage/' . $this->signature_path) : null;
    }

    public function getLocalSignaturePath(): ?string
    {
        if ($this->signature_path && file_exists(storage_path('app/public/' . $this->signature_path))) {
            return storage_path('app/public/' . $this->signature_path);
        }
        return null;
    }

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

    public function isGuardian(): bool
    {
        return $this->role === 'guardian' || $this->role === 'parent';
    }

    public function guardian()
    {
        return $this->hasOne(Guardian::class);
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

    public function timetables()
    {
        return $this->hasMany(Timetable::class, 'teacher_id');
    }
}
