<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Class SchoolSetting
 *
 * Manages institutional identity metadata, dynamic scoring thresholds,
 * grade boundaries, and official administrative authorization assets (logos, signatures, stamps).
 *
 * @package App\Models
 */
class SchoolSetting extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'school_settings';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'motto',
        'address',
        'phone',
        'email',
        'principal_name',
        'logo_path',
        'principal_signature_path',
        'stamp_path',
        'max_ca_score',
        'max_exam_score',
        'grade_a_min',
        'grade_b_min',
        'grade_c_min',
        'grade_d_min',
        'grade_e_min',
    ];

    /**
     * Virtual attributes appended to JSON serialization.
     *
     * @var array<int, string>
     */
    protected $appends = [
        'logo_url',
        'principal_signature_url',
        'stamp_url',
        'school_name',
        'school_motto',
        'school_address',
        'school_phone',
        'school_email',
        'school_logo_path',
        'school_stamp_path',
        'school_stamp_url',
    ];

    /**
     * URL Accessor for School Logo
     */
    public function getLogoUrlAttribute(): ?string
    {
        return $this->logo_path ? asset('storage/' . $this->logo_path) : null;
    }

    /**
     * URL Accessor for Principal Signature
     */
    public function getPrincipalSignatureUrlAttribute(): ?string
    {
        return $this->principal_signature_path ? asset('storage/' . $this->principal_signature_path) : null;
    }

    /**
     * URL Accessor for Official Stamp / Seal
     */
    public function getStampUrlAttribute(): ?string
    {
        return $this->stamp_path ? asset('storage/' . $this->stamp_path) : null;
    }

    public function getSchoolStampUrlAttribute(): ?string
    {
        return $this->getStampUrlAttribute();
    }

    // Standard alias accessors for seamless interoperability
    public function getSchoolNameAttribute(): ?string
    {
        return $this->name;
    }

    public function getSchoolMottoAttribute(): ?string
    {
        return $this->motto;
    }

    public function getSchoolAddressAttribute(): ?string
    {
        return $this->address;
    }

    public function getSchoolPhoneAttribute(): ?string
    {
        return $this->phone;
    }

    public function getSchoolEmailAttribute(): ?string
    {
        return $this->email;
    }

    public function getSchoolLogoPathAttribute(): ?string
    {
        return $this->logo_path;
    }

    public function getSchoolStampPathAttribute(): ?string
    {
        return $this->stamp_path;
    }

    /**
     * Resolve absolute disk path for DomPDF rendering.
     */
    public function getLocalLogoPath(): ?string
    {
        if ($this->logo_path && file_exists(storage_path('app/public/' . $this->logo_path))) {
            return storage_path('app/public/' . $this->logo_path);
        }
        return null;
    }

    public function getLocalPrincipalSignaturePath(): ?string
    {
        if ($this->principal_signature_path && file_exists(storage_path('app/public/' . $this->principal_signature_path))) {
            return storage_path('app/public/' . $this->principal_signature_path);
        }
        return null;
    }

    public function getLocalStampPath(): ?string
    {
        if ($this->stamp_path && file_exists(storage_path('app/public/' . $this->stamp_path))) {
            return storage_path('app/public/' . $this->stamp_path);
        }
        return null;
    }
}
