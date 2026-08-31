<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Student extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'admission_number',
        'first_name',
        'last_name',
        'class_id',
        'gender',
        'guardian_phone',
        'fee_cleared_status',
        'photo_path',
    ];

    protected $casts = [
        'fee_cleared_status' => 'boolean',
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
