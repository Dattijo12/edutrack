<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Timetable
 *
 * Represents an individual class timetable entry specifying a scheduled subject,
 * teaching staff, day of the week, and start/end time.
 *
 * @package App\Models
 */
class Timetable extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'timetables';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'school_class_id',
        'subject_id',
        'teacher_id',
        'day_of_week',
        'start_time',
        'end_time',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'school_class_id' => 'integer',
        'subject_id' => 'integer',
        'teacher_id' => 'integer',
    ];

    /**
     * Get the school class that owns this timetable schedule entry.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function schoolClass()
    {
        return $this->belongsTo(SchoolClass::class, 'school_class_id');
    }

    /**
     * Get the academic subject scheduled for this slot.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function subject()
    {
        return $this->belongsTo(Subject::class, 'subject_id');
    }

    /**
     * Get the teacher assigned to instruct this subject slot.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }
}
