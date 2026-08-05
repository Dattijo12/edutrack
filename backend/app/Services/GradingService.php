<?php

namespace App\Services;

use App\Models\SchoolSetting;
use App\Models\Result;
use App\Models\TermSummary;

class GradingService
{
    /**
     * Standard WAEC / NECO Grading Scale
     * A1: 75 - 100 (Excellent)
     * B2: 70 - 74 (Very Good)
     * B3: 65 - 69 (Good)
     * C4: 60 - 64 (Credit)
     * C5: 55 - 59 (Credit)
     * C6: 50 - 54 (Credit)
     * D7: 45 - 49 (Pass)
     * E8: 40 - 44 (Pass)
     * F9: 0 - 39 (Fail)
     */
    public static function calculateGrade(float $score): array
    {
        if ($score >= 75) return ['grade' => 'A1', 'remark' => 'Excellent'];
        if ($score >= 70) return ['grade' => 'B2', 'remark' => 'Very Good'];
        if ($score >= 65) return ['grade' => 'B3', 'remark' => 'Good'];
        if ($score >= 60) return ['grade' => 'C4', 'remark' => 'Credit'];
        if ($score >= 55) return ['grade' => 'C5', 'remark' => 'Credit'];
        if ($score >= 50) return ['grade' => 'C6', 'remark' => 'Credit'];
        if ($score >= 45) return ['grade' => 'D7', 'remark' => 'Pass'];
        if ($score >= 40) return ['grade' => 'E8', 'remark' => 'Pass'];
        return ['grade' => 'F9', 'remark' => 'Fail'];
    }

    /**
     * Get maximum allowed CA and Exam scores configured in SchoolSettings
     */
    public static function getMaxScores(): array
    {
        $settings = SchoolSetting::first();
        return [
            'max_ca' => $settings ? (float) $settings->max_ca_score : 30.00,
            'max_exam' => $settings ? (float) $settings->max_exam_score : 70.00,
        ];
    }

    /**
     * Recalculate subject positions for a specific subject, class, term and session.
     */
    public static function updateSubjectPositions($subjectId, $classId, $term, $session): void
    {
        $results = Result::where('subject_id', $subjectId)
            ->where('term', $term)
            ->where('academic_session', $session)
            ->when($classId, fn($q) => $q->where('class_id', $classId))
            ->orderBy('total_score', 'desc')
            ->get();

        $rank = 1;
        foreach ($results as $index => $result) {
            // Equal scores get equal rank
            if ($index > 0 && $results[$index]->total_score < $results[$index - 1]->total_score) {
                $rank = $index + 1;
            }
            $result->subject_position = $rank;
            $result->save();
        }
    }

    /**
     * Format ordinal numbers (1st, 2nd, 3rd, 4th...)
     */
    public static function ordinal(int $number): string
    {
        $ends = ['th','st','nd','rd','th','th','th','th','th','th'];
        if ((($number % 100) >= 11) && (($number % 100) <= 13)) {
            return $number . 'th';
        } else {
            return $number . $ends[$number % 10];
        }
    }
}
