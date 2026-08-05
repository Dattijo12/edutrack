<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subject extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'category',
    ];

    public function results()
    {
        return $this->hasMany(Result::class);
    }

    public function assignments()
    {
        return $this->hasMany(SubjectAssignment::class, 'subject_id');
    }
}
