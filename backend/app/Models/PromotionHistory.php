<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PromotionHistory extends Model
{
    use HasFactory;

    /**
     * Mass-assignable attributes for promotion history entries.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'student_id',
        'from_class_id',
        'to_class_id',
        'result_window_id',
        'status',
    ];

    /**
     * The student who underwent this class transition.
     */
    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    /**
     * The class the student was in before the transition.
     * Nullable — may be null for initial enrollment records.
     */
    public function fromClass()
    {
        return $this->belongsTo(SchoolClass::class, 'from_class_id');
    }

    /**
     * The class the student moved into after the transition.
     * Nullable — may be null for graduation records (no destination class).
     */
    public function toClass()
    {
        return $this->belongsTo(SchoolClass::class, 'to_class_id');
    }

    /**
     * The academic result window (session/term) during which this promotion occurred.
     */
    public function resultWindow()
    {
        return $this->belongsTo(ResultWindow::class);
    }
}
