<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ResultWindow extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'academic_session',
        'term',
        'is_open',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'is_open' => 'boolean',
    ];

    /**
     * Scope to find open result window for a session and term.
     */
    public function scopeIsOpen($query, string $session = null, string $term = null)
    {
        $query->where('is_open', true);

        if ($session) {
            $query->where('academic_session', $session);
        }

        if ($term) {
            $query->where('term', $term);
        }

        return $query;
    }
}
