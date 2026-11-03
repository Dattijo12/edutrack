<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SchoolClass;
use App\Models\Student;
use App\Models\Timetable;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * Class TimetableController
 *
 * Handles API operations for managing and retrieving class timetable schedules,
 * enforcing conflict validation for classrooms and teachers, and maintaining role-based access.
 *
 * @package App\Http\Controllers\Api
 */
class TimetableController extends Controller
{
    /**
     * Supported days of the week in chronological sequence.
     */
    private const DAYS_OF_WEEK = [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
    ];

    /**
     * Fetch the timetable schedule for a specific class, ordered by day of the week and start time.
     * Accessible by admins, teachers, and enrolled students of that specific class.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int|string  $classId
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request, $classId): JsonResponse
    {
        $user = $request->user();

        // 1. Role-based authorization & IDOR prevention for students
        $isStudent = ($user instanceof Student) || (isset($user->role) && $user->role === 'student');

        if ($isStudent) {
            // Students can only access the timetable for their officially assigned class
            if ((int) $user->class_id !== (int) $classId) {
                return response()->json([
                    'status' => 'forbidden',
                    'message' => 'Forbidden. You do not have permission to view the timetable for another class.',
                ], 403);
            }
        } else {
            // Staff members: Ensure user possesses an authorized staff role
            $allowedStaffRoles = ['admin', 'super_admin', 'teacher', 'form_master', 'exam_officer'];
            if (isset($user->role) && !in_array($user->role, $allowedStaffRoles)) {
                return response()->json([
                    'status' => 'forbidden',
                    'message' => 'Forbidden. Insufficient permissions to access class timetable.',
                ], 403);
            }
        }

        // 2. Validate existence of target class
        $schoolClass = SchoolClass::find($classId);
        if (!$schoolClass) {
            return response()->json([
                'status' => 'error',
                'message' => 'School class not found.',
            ], 404);
        }

        // 3. Chronological day order mapping (portable across SQLite, MySQL, and PostgreSQL)
        $dayOrderSql = "CASE day_of_week 
            WHEN 'Monday' THEN 1 
            WHEN 'Tuesday' THEN 2 
            WHEN 'Wednesday' THEN 3 
            WHEN 'Thursday' THEN 4 
            WHEN 'Friday' THEN 5 
            WHEN 'Saturday' THEN 6 
            WHEN 'Sunday' THEN 7 
            ELSE 8 END";

        // 4. Retrieve timetable entries with eager loading to prevent N+1 query overhead
        $timetable = Timetable::with([
                'subject:id,name,code,category',
                'teacher:id,name,email,phone',
                'schoolClass:id,name,arm',
            ])
            ->where('school_class_id', $classId)
            ->orderByRaw($dayOrderSql)
            ->orderBy('start_time', 'asc')
            ->get();

        return response()->json([
            'status' => 'success',
            'class' => [
                'id' => $schoolClass->id,
                'name' => $schoolClass->name,
                'arm' => $schoolClass->arm,
            ],
            'data' => $timetable,
        ], 200);
    }

    /**
     * Create a new timetable entry.
     * Restricted to school administrators and principals.
     * Enforces double-booking conflict validation for classroom and teacher schedules.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        // 1. Validate request payload
        $validated = $request->validate([
            'school_class_id' => 'required|exists:classes,id',
            'subject_id'      => 'required|exists:subjects,id',
            'teacher_id'      => 'required|exists:users,id',
            'day_of_week'     => ['required', Rule::in(self::DAYS_OF_WEEK)],
            'start_time'      => ['required', 'regex:/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/'],
            'end_time'        => ['required', 'regex:/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/'],
        ]);

        // 2. Logical sequence verification: start_time must be strictly before end_time
        if ($validated['start_time'] >= $validated['end_time']) {
            return response()->json([
                'status'  => 'error',
                'message' => 'The end time must be after the start time.',
                'errors'  => [
                    'end_time' => ['The end time must be strictly after the start time.'],
                ],
            ], 422);
        }

        $classId   = $validated['school_class_id'];
        $teacherId = $validated['teacher_id'];
        $dayOfWeek = $validated['day_of_week'];
        $startTime = $validated['start_time'];
        $endTime   = $validated['end_time'];

        // 3. Schedule Conflict Validation: Ensure the classroom is not double-booked
        $classroomConflict = Timetable::where('school_class_id', $classId)
            ->where('day_of_week', $dayOfWeek)
            ->where(function ($query) use ($startTime, $endTime) {
                $query->where('start_time', '<', $endTime)
                      ->where('end_time', '>', $startTime);
            })
            ->with(['subject:id,name,code', 'schoolClass:id,name,arm'])
            ->first();

        if ($classroomConflict) {
            $conflictSubject = $classroomConflict->subject?->name ?? 'Another subject';
            $conflictClass   = "{$classroomConflict->schoolClass?->name} {$classroomConflict->schoolClass?->arm}";
            return response()->json([
                'status'        => 'conflict',
                'conflict_type' => 'classroom',
                'message'       => "Classroom schedule conflict: {$conflictClass} already has {$conflictSubject} scheduled on {$dayOfWeek} from {$classroomConflict->start_time} to {$classroomConflict->end_time}.",
                'conflict'      => $classroomConflict,
            ], 422);
        }

        // 4. Schedule Conflict Validation: Ensure the teacher is not double-booked across any classroom
        $teacherConflict = Timetable::where('teacher_id', $teacherId)
            ->where('day_of_week', $dayOfWeek)
            ->where(function ($query) use ($startTime, $endTime) {
                $query->where('start_time', '<', $endTime)
                      ->where('end_time', '>', $startTime);
            })
            ->with(['subject:id,name,code', 'schoolClass:id,name,arm', 'teacher:id,name'])
            ->first();

        if ($teacherConflict) {
            $conflictTeacher = $teacherConflict->teacher?->name ?? 'The selected teacher';
            $conflictSubject = $teacherConflict->subject?->name ?? 'a subject';
            $conflictClass   = $teacherConflict->schoolClass
                ? "{$teacherConflict->schoolClass->name} {$teacherConflict->schoolClass->arm}"
                : 'another class';

            return response()->json([
                'status'        => 'conflict',
                'conflict_type' => 'teacher',
                'message'       => "Teacher schedule conflict: {$conflictTeacher} is already booked to teach {$conflictSubject} for {$conflictClass} on {$dayOfWeek} from {$teacherConflict->start_time} to {$teacherConflict->end_time}.",
                'conflict'      => $teacherConflict,
            ], 422);
        }

        // 5. Atomic database persistence
        $timetable = DB::transaction(function () use ($validated) {
            return Timetable::create($validated);
        });

        $timetable->load([
            'subject:id,name,code,category',
            'teacher:id,name,email,phone',
            'schoolClass:id,name,arm',
        ]);

        // 6. Security audit logging
        if (class_exists(AuditService::class)) {
            AuditService::log(
                'timetable_created',
                "Created timetable entry #{$timetable->id}: {$timetable->subject?->name} for class ID {$timetable->school_class_id} on {$timetable->day_of_week} ({$timetable->start_time} - {$timetable->end_time})",
                $timetable
            );
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'Timetable entry created successfully.',
            'data'    => $timetable,
        ], 201);
    }

    /**
     * Delete a timetable entry.
     * Restricted to school administrators and principals.
     *
     * @param  int|string  $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id): JsonResponse
    {
        $timetable = Timetable::with(['subject:id,name', 'schoolClass:id,name,arm'])->find($id);

        if (!$timetable) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Timetable entry not found.',
            ], 404);
        }

        $entryDetails = "Entry #{$timetable->id} ({$timetable->subject?->name} on {$timetable->day_of_week})";

        DB::transaction(function () use ($timetable) {
            $timetable->delete();
        });

        // Security audit logging
        if (class_exists(AuditService::class)) {
            AuditService::log(
                'timetable_deleted',
                "Deleted timetable {$entryDetails}",
                $timetable
            );
        }

        return response()->json([
            'status'  => 'success',
            'message' => 'Timetable entry deleted successfully.',
        ], 200);
    }
}
