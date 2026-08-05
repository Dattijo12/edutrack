<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AcademicTerm extends Model
{
    use HasFactory;

    protected $fillable = [
        'session',
        'term',
        'is_current',
    ];

    protected $casts = [
        'is_current' => 'boolean',
    ];
}
