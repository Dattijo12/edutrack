<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SchoolSetting extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     * Includes school metadata, dynamic scoring limits, and letter grade boundaries.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'address',
        'phone',
        'email',
        'logo_path',
        'principal_signature_path',
        'max_ca_score',
        'max_exam_score',
        'grade_a_min',
        'grade_b_min',
        'grade_c_min',
        'grade_d_min',
        'grade_e_min',
    ];

    protected $appends = [
        'logo_url',
        'principal_signature_url',
    ];

    public function getLogoUrlAttribute()
    {
        return $this->logo_path ? asset('storage/' . $this->logo_path) : null;
    }

    public function getPrincipalSignatureUrlAttribute()
    {
        return $this->principal_signature_path ? asset('storage/' . $this->principal_signature_path) : null;
    }
}
