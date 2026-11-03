{{-- 
    PDF Report Card Template
    Rendered server-side by barryvdh/laravel-dompdf.
    Uses inline-friendly CSS compatible with DomPDF's rendering engine.
--}}
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Report Card - {{ $student->name ?? 'Student' }}</title>
    <style>
        /* ===== Base Reset & Typography ===== */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'DejaVu Sans', Arial, Helvetica, sans-serif;
            font-size: 11px;
            color: #1a1a2e;
            line-height: 1.5;
            background: #fff;
        }

        /* ===== Page Container ===== */
        .page-container {
            width: 100%;
            padding: 20px 30px;
        }

        /* ===== School Header Section ===== */
        .school-header {
            text-align: center;
            border-bottom: 3px solid #1e3a5f;
            padding-bottom: 12px;
            margin-bottom: 16px;
        }
        .school-header .school-name {
            font-size: 22px;
            font-weight: bold;
            color: #1e3a5f;
            text-transform: uppercase;
            letter-spacing: 1.5px;
        }
        .school-header .school-address {
            font-size: 10px;
            color: #555;
            margin-top: 3px;
        }
        .school-header .school-contact {
            font-size: 9px;
            color: #777;
            margin-top: 2px;
        }
        .school-header .report-title {
            font-size: 14px;
            font-weight: bold;
            color: #fff;
            background-color: #1e3a5f;
            display: inline-block;
            padding: 4px 24px;
            margin-top: 10px;
            letter-spacing: 1px;
            text-transform: uppercase;
        }

        /* ===== Student Bio-Data Section ===== */
        .bio-section {
            margin-bottom: 14px;
        }
        .bio-table {
            width: 100%;
            border-collapse: collapse;
        }
        .bio-table td {
            padding: 5px 8px;
            font-size: 10.5px;
            vertical-align: top;
        }
        .bio-label {
            font-weight: bold;
            color: #1e3a5f;
            width: 140px;
            white-space: nowrap;
        }
        .bio-value {
            color: #333;
        }
        .bio-divider {
            border-bottom: 1px solid #e0e0e0;
        }

        /* ===== Grades Table ===== */
        .grades-section {
            margin-bottom: 14px;
        }
        .grades-section .section-title {
            font-size: 11px;
            font-weight: bold;
            color: #1e3a5f;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding-bottom: 4px;
            border-bottom: 2px solid #1e3a5f;
            margin-bottom: 6px;
        }
        .grades-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 4px;
        }
        .grades-table thead th {
            background-color: #1e3a5f;
            color: #fff;
            font-size: 9.5px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 7px 6px;
            text-align: center;
            border: 1px solid #1e3a5f;
        }
        .grades-table thead th:first-child {
            text-align: left;
            padding-left: 10px;
        }
        .grades-table tbody td {
            padding: 6px 6px;
            font-size: 10.5px;
            text-align: center;
            border: 1px solid #d0d0d0;
            color: #333;
        }
        .grades-table tbody td:first-child {
            text-align: left;
            padding-left: 10px;
            font-weight: 600;
            color: #1a1a2e;
        }
        .grades-table tbody tr:nth-child(even) {
            background-color: #f7f9fc;
        }
        .grades-table tbody tr:hover {
            background-color: #eef2f9;
        }

        /* Summary footer row */
        .grades-table tfoot td {
            padding: 7px 6px;
            font-size: 10.5px;
            font-weight: bold;
            text-align: center;
            border: 1px solid #1e3a5f;
            background-color: #e8edf4;
            color: #1e3a5f;
        }
        .grades-table tfoot td:first-child {
            text-align: left;
            padding-left: 10px;
        }

        /* ===== Summary Stats Row ===== */
        .summary-row {
            margin-bottom: 14px;
        }
        .summary-table {
            width: 100%;
            border-collapse: collapse;
        }
        .summary-table td {
            width: 25%;
            text-align: center;
            padding: 8px 4px;
            border: 1px solid #d0d0d0;
        }
        .summary-label {
            font-size: 8.5px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #777;
            display: block;
            margin-bottom: 2px;
        }
        .summary-value {
            font-size: 16px;
            font-weight: bold;
            color: #1e3a5f;
        }

        /* ===== Remarks Section ===== */
        .remarks-section {
            margin-bottom: 16px;
        }
        .remarks-section .section-title {
            font-size: 11px;
            font-weight: bold;
            color: #1e3a5f;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding-bottom: 4px;
            border-bottom: 2px solid #1e3a5f;
            margin-bottom: 8px;
        }
        .remark-block {
            margin-bottom: 10px;
            padding: 8px 12px;
            border-left: 3px solid #1e3a5f;
            background-color: #f7f9fc;
        }
        .remark-label {
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #1e3a5f;
            margin-bottom: 2px;
        }
        .remark-text {
            font-size: 10.5px;
            color: #333;
            font-style: italic;
            line-height: 1.6;
        }

        /* ===== Signature Section ===== */
        .signature-section {
            margin-top: 24px;
            page-break-inside: avoid;
        }
        .signature-table {
            width: 100%;
            border-collapse: collapse;
        }
        .signature-table td {
            width: 33.33%;
            text-align: center;
            padding-top: 30px;
            vertical-align: bottom;
        }
        .signature-line {
            border-top: 1px solid #999;
            display: inline-block;
            width: 150px;
            margin-bottom: 3px;
        }
        .signature-name {
            font-size: 9px;
            font-weight: bold;
            color: #555;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* ===== Footer ===== */
        .page-footer {
            margin-top: 20px;
            padding-top: 8px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 8px;
            color: #999;
        }

        /* ===== Grade Key Table ===== */
        .grade-key {
            margin-top: 8px;
            margin-bottom: 14px;
        }
        .grade-key-table {
            width: auto;
            border-collapse: collapse;
            margin: 0 auto;
        }
        .grade-key-table td {
            padding: 3px 10px;
            font-size: 9px;
            border: 1px solid #d0d0d0;
            text-align: center;
        }
        .grade-key-table td.grade-letter {
            font-weight: bold;
            color: #1e3a5f;
            background-color: #eef2f9;
        }
    </style>
</head>
<body>
    <div class="page-container">

        {{-- ===== SCHOOL HEADER ===== --}}
        <div class="school-header">
            <div class="school-name">{{ $school->name ?? 'EduTrack Academy' }}</div>
            <div class="school-address">{{ $school->address ?? 'No. 1 Academic Drive, Education City' }}</div>
            <div class="school-contact">
                @if($school->phone ?? false)Tel: {{ $school->phone }}@endif
                @if(($school->phone ?? false) && ($school->email ?? false)) &nbsp;|&nbsp; @endif
                @if($school->email ?? false)Email: {{ $school->email }}@endif
            </div>
            <div class="report-title">Terminal Report Card</div>
        </div>

        {{-- ===== STUDENT BIO-DATA ===== --}}
        <div class="bio-section">
            <table class="bio-table">
                <tr class="bio-divider">
                    <td class="bio-label">Student Name:</td>
                    <td class="bio-value">{{ $student->name ?? 'N/A' }}</td>
                    <td class="bio-label">Admission No.:</td>
                    <td class="bio-value">{{ $student->admission_number ?? 'N/A' }}</td>
                </tr>
                <tr class="bio-divider">
                    <td class="bio-label">Class:</td>
                    <td class="bio-value">
                        {{ $student->class ? trim($student->class->name . ' ' . ($student->class->arm ?? '')) : 'N/A' }}
                    </td>
                    <td class="bio-label">Gender:</td>
                    <td class="bio-value">{{ ucfirst($student->gender ?? 'N/A') }}</td>
                </tr>
                <tr class="bio-divider">
                    <td class="bio-label">Academic Session:</td>
                    <td class="bio-value">{{ $session }}</td>
                    <td class="bio-label">Term:</td>
                    <td class="bio-value">{{ $term }}</td>
                </tr>
            </table>
        </div>

        {{-- ===== AGGREGATE SUMMARY STATS ===== --}}
        <div class="summary-row">
            <table class="summary-table">
                <tr>
                    <td>
                        <span class="summary-label">Total Score</span>
                        <span class="summary-value">{{ $summary['total_score'] }}</span>
                    </td>
                    <td>
                        <span class="summary-label">Average (%)</span>
                        <span class="summary-value">{{ $summary['average'] }}%</span>
                    </td>
                    <td>
                        <span class="summary-label">Class Position</span>
                        <span class="summary-value">{{ $summary['class_position'] }}</span>
                    </td>
                    <td>
                        <span class="summary-label">Attendance</span>
                        <span class="summary-value">{{ $summary['attendance_present'] }}/{{ $summary['attendance_total'] }}</span>
                    </td>
                </tr>
            </table>
        </div>

        {{-- ===== SUBJECT GRADES TABLE ===== --}}
        <div class="grades-section">
            <div class="section-title">Subject Performance Breakdown</div>
            <table class="grades-table">
                <thead>
                    <tr>
                        <th style="width: 5%;">#</th>
                        <th style="width: 30%;">Subject</th>
                        <th style="width: 12%;">CA (30)</th>
                        <th style="width: 12%;">Exam (70)</th>
                        <th style="width: 12%;">Total (100)</th>
                        <th style="width: 10%;">Grade</th>
                        <th style="width: 19%;">Remark</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse ($results as $index => $result)
                        <tr>
                            <td>{{ $index + 1 }}</td>
                            <td style="text-align: left; padding-left: 10px; font-weight: 600;">
                                {{ $result->subject->name ?? 'Subject' }}
                            </td>
                            <td>{{ $result->ca_score }}</td>
                            <td>{{ $result->exam_score }}</td>
                            <td style="font-weight: bold;">{{ $result->total_score }}</td>
                            <td style="font-weight: bold;">{{ $result->grade ?? '-' }}</td>
                            <td style="font-size: 9.5px;">{{ $result->remark ?? 'Satisfactory' }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="7" style="text-align: center; color: #999; padding: 16px;">
                                No approved subject records found for this term.
                            </td>
                        </tr>
                    @endforelse
                </tbody>
                @if($results->count() > 0)
                <tfoot>
                    <tr>
                        <td colspan="2" style="text-align: left; padding-left: 10px;">
                            TOTAL ({{ $summary['subjects_count'] }} Subject{{ $summary['subjects_count'] > 1 ? 's' : '' }})
                        </td>
                        <td>{{ $results->sum('ca_score') }}</td>
                        <td>{{ $results->sum('exam_score') }}</td>
                        <td>{{ $summary['total_score'] }}</td>
                        <td colspan="2">Average: {{ $summary['average'] }}%</td>
                    </tr>
                </tfoot>
                @endif
            </table>
        </div>

        {{-- ===== GRADE KEY ===== --}}
        <div class="grade-key">
            <table class="grade-key-table">
                <tr>
                    <td class="grade-letter">A</td>
                    <td>{{ $school->grade_a_min ?? 75 }}-100 (Excellent)</td>
                    <td class="grade-letter">B</td>
                    <td>{{ $school->grade_b_min ?? 65 }}-{{ ($school->grade_a_min ?? 75) - 1 }} (Very Good)</td>
                    <td class="grade-letter">C</td>
                    <td>{{ $school->grade_c_min ?? 50 }}-{{ ($school->grade_b_min ?? 65) - 1 }} (Good)</td>
                    <td class="grade-letter">D</td>
                    <td>{{ $school->grade_d_min ?? 40 }}-{{ ($school->grade_c_min ?? 50) - 1 }} (Pass)</td>
                    <td class="grade-letter">F</td>
                    <td>0-{{ ($school->grade_d_min ?? 40) - 1 }} (Fail)</td>
                </tr>
            </table>
        </div>

        {{-- ===== OFFICIAL REMARKS ===== --}}
        <div class="remarks-section">
            <div class="section-title">Official Remarks</div>

            <div class="remark-block">
                <div class="remark-label">Form Master's Remark</div>
                <div class="remark-text">"{{ $summary['form_master_remark'] }}"</div>
            </div>

            <div class="remark-block">
                <div class="remark-label">Principal's Endorsement</div>
                <div class="remark-text">"{{ $summary['principal_remark'] }}"</div>
            </div>
        </div>

        {{-- ===== SIGNATURE SECTION ===== --}}
        <div class="signature-section">
            <table class="signature-table">
                <tr>
                    <td>
                        <div class="signature-line"></div>
                        <div class="signature-name">Form Master</div>
                    </td>
                    <td>
                        <div class="signature-line"></div>
                        <div class="signature-name">Exam Officer</div>
                    </td>
                    <td>
                        <div class="signature-line"></div>
                        <div class="signature-name">Principal</div>
                    </td>
                </tr>
            </table>
        </div>

        {{-- ===== FOOTER ===== --}}
        <div class="page-footer">
            This is an official school document generated on {{ $generated_at }}.
            &bull; {{ $school->name ?? 'EduTrack Academy' }}
            &bull; Any alteration renders this document invalid.
        </div>
    </div>
</body>
</html>
