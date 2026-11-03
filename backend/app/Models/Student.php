<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\SoftDeletes;
use Laravel\Sanctum\HasApiTokens;

class Student extends Authenticatable
{
    use HasApiTokens, HasFactory, SoftDeletes;

    protected $fillable = [
        'admission_number',
        'first_name',
        'last_name',
        'class_id',
        'guardian_id',
        'gender',
        'password',
        'pin',
        'dob',
        'parent_phone',
        'guardian_phone',
        'fee_cleared_status',
        'photo_path',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'fee_cleared_status' => 'boolean',
        'password' => 'hashed',
    ];

    // Append computed attributes to every JSON response
    protected $appends = ['name'];

    // Accessor for full name
    public function getNameAttribute()
    {
        return trim("{$this->first_name} {$this->last_name}");
    }

    public function class()
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function guardian()
    {
        return $this->belongsTo(Guardian::class);
    }

    public function results()
    {
        return $this->hasMany(Result::class);
    }

    public function feePayments()
    {
        return $this->hasMany(FeePayment::class);
    }

    public function termSummaries()
    {
        return $this->hasMany(TermSummary::class);
    }
}
