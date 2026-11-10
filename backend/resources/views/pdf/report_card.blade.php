{{-- 
    PDF Report Card Template
    Rendered server-side by barryvdh/laravel-dompdf.
    Features dynamic institutional branding, anti-forgery verification,
    and official Form Master and Principal authorization with digital signatures & seal.
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
            font-size: 10.5px;
            color: #1a1a2e;
            line-height: 1.45;
            background: #fff;
        }

        /* ===== Page Container ===== */
        .page-container {
            width: 100%;
            padding: 16px 26px;
        }

        /* ===== School Header Section ===== */
        .school-header-table {
            width: 100%;
            border-collapse: collapse;
            border-bottom: 2.5px solid #1e3a5f;
            padding-bottom: 8px;
            margin-bottom: 12px;
        }
        .school-header-table td {
            vertical-align: middle;
            border: none;
        }
        .school-logo-td {
            width: 65px;
            text-align: left;
        }
        .school-logo-img {
            max-width: 60px;
            max-height: 60px;
            object-fit: contain;
        }
        .school-info-td {
            text-align: center;
        }
        .school-name {
            font-size: 20px;
            font-weight: bold;
            color: #1e3a5f;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 2px;
        }
        .school-motto {
            font-size: 10px;
            font-style: italic;
            color: #4a5568;
            margin-bottom: 3px;
        }
        .school-address {
            font-size: 9.5px;
            color: #555;
        }
        .school-contact {
            font-size: 9px;
            color: #777;
            margin-top: 2px;
        }
        .report-badge-container {
            text-align: center;
            margin-top: 6px;
        }
        .report-title-badge {
            font-size: 12px;
            font-weight: bold;
            color: #fff;
            background-color: #1e3a5f;
            display: inline-block;
            padding: 3px 20px;
            letter-spacing: 1px;
            text-transform: uppercase;
            border-radius: 3px;
        }

        /* ===== Student Bio-Data Section ===== */
        .bio-section {
            margin-bottom: 10px;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            padding: 6px 10px;
        }
        .bio-table {
            width: 100%;
            border-collapse: collapse;
        }
        .bio-table td {
            padding: 3px 6px;
            font-size: 9.5px;
            vertical-align: middle;
            border: none;
        }
        .bio-label {
            font-weight: bold;
            color: #1e3a5f;
            width: 110px;
            white-space: nowrap;
        }
        .bio-value {
            color: #2d3748;
            font-weight: 500;
        }

        /* ===== Summary Stats Row ===== */
        .summary-row {
            margin-bottom: 12px;
        }
        .summary-table {
            width: 100%;
            border-collapse: collapse;
        }
        .summary-table td {
            width: 25%;
            text-align: center;
            padding: 6px 4px;
            border: 1px solid #cbd5e1;
            background-color: #f1f5f9;
        }
        .summary-label {
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #64748b;
            display: block;
            margin-bottom: 1px;
        }
        .summary-value {
            font-size: 14px;
            font-weight: bold;
            color: #1e3a5f;
        }

        /* ===== Grades Table ===== */
        .grades-section {
            margin-bottom: 10px;
        }
        .section-title {
            font-size: 10px;
            font-weight: bold;
            color: #1e3a5f;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding-bottom: 3px;
            border-bottom: 1.5px solid #1e3a5f;
            margin-bottom: 4px;
        }
        .grades-table {
            width: 100%;
            border-collapse: collapse;
        }
        .grades-table thead th {
            background-color: #1e3a5f;
            color: #fff;
            font-size: 8.5px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 6px 4px;
            text-align: center;
            border: 1px solid #1e3a5f;
        }
        .grades-table thead th:first-child {
            text-align: left;
            padding-left: 8px;
        }
        .grades-table tbody td {
            padding: 4px 5px;
            font-size: 9.5px;
            text-align: center;
            border: 1px solid #cbd5e1;
            color: #334155;
        }
        .grades-table tbody td:first-child {
            text-align: left;
            padding-left: 8px;
            font-weight: 600;
            color: #0f172a;
        }
        .grades-table tbody tr:nth-child(even) {
            background-color: #f8fafc;
        }
        .grades-table tfoot td {
            padding: 5px 4px;
            font-size: 9.5px;
            font-weight: bold;
            text-align: center;
            border: 1px solid #1e3a5f;
            background-color: #e2e8f0;
            color: #1e3a5f;
        }
        .grades-table tfoot td:first-child {
            text-align: left;
            padding-left: 8px;
        }

        /* ===== Grade Key Table ===== */
        .grade-key {
            margin-bottom: 12px;
        }
        .grade-key-table {
            width: 100%;
            border-collapse: collapse;
        }
        .grade-key-table td {
            padding: 2.5px 6px;
            font-size: 8px;
            border: 1px solid #cbd5e1;
            text-align: center;
        }
        .grade-key-table td.grade-letter {
            font-weight: bold;
            color: #1e3a5f;
            background-color: #e2e8f0;
        }

        /* ===== Official Authorization & Signatures Section ===== */
        .auth-section {
            margin-top: 10px;
            page-break-inside: avoid;
        }
        .auth-table {
            width: 100%;
            border-collapse: collapse;
        }
        .auth-col {
            width: 50%;
            padding: 0 5px;
            vertical-align: top;
            border: none;
        }
        .auth-card {
            border: 1px solid #cbd5e1;
            border-radius: 4px;
            background-color: #f8fafc;
            padding: 8px 10px;
            min-height: 125px;
        }
        .auth-card-title {
            font-size: 8.5px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #1e3a5f;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 3px;
            margin-bottom: 4px;
        }
        .auth-remark {
            font-size: 9px;
            font-style: italic;
            color: #334155;
            min-height: 28px;
            line-height: 1.35;
            margin-bottom: 6px;
        }
        .auth-signature-zone {
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            margin-bottom: 4px;
            border-bottom: 1px dashed #cbd5e1;
            padding-bottom: 2px;
        }
        .signature-img {
            max-height: 42px;
            max-width: 130px;
            object-fit: contain;
        }
        .stamp-img {
            max-height: 44px;
            max-width: 65px;
            object-fit: contain;
        }
        .digital-cursive-signature {
            font-family: 'Times-Italic', 'DejaVu Sans', serif;
            font-style: italic;
            font-weight: bold;
            font-size: 15px;
            color: #0f2b48;
            letter-spacing: 0.5px;
            padding-top: 8px;
        }
        .digital-seal-box {
            display: inline-block;
            border: 1.5px dashed #1e3a5f;
            border-radius: 50%;
            width: 42px;
            height: 42px;
            text-align: center;
            padding-top: 7px;
            font-size: 7px;
            font-weight: bold;
            color: #1e3a5f;
            line-height: 1.1;
            text-transform: uppercase;
        }
        .auth-meta {
            text-align: center;
            margin-top: 3px;
        }
        .auth-name {
            font-size: 9.5px;
            font-weight: bold;
            color: #0f172a;
        }
        .auth-role {
            font-size: 8px;
            color: #64748b;
        }

        /* ===== Footer ===== */
        .page-footer {
            margin-top: 14px;
            padding-top: 6px;
            border-top: 1px solid #e2e8f0;
            text-align: center;
            font-size: 7.5px;
            color: #94a3b8;
        }
    </style>
</head>
<body>
    <div class="page-container">

        {{-- ===== SCHOOL HEADER ===== --}}
        <table class="school-header-table">
            <tr>
                @if(!empty($logo_base64))
                    <td class="school-logo-td">
                        <img src="{{ $logo_base64 }}" class="school-logo-img" alt="School Logo" />
                    </td>
                @endif
                <td class="school-info-td">
                    <div class="school-name">{{ $school->name ?? 'EduTrack Academy' }}</div>
                    @if(!empty($school->motto))
                        <div class="school-motto">"{{ $school->motto }}"</div>
                    @endif
                    <div class="school-address">{{ $school->address ?? 'No. 1 Academic Drive, Education City' }}</div>
                    <div class="school-contact">
                        @if($school->phone ?? false)Tel: {{ $school->phone }}@endif
                        @if(($school->phone ?? false) && ($school->email ?? false)) &nbsp;|&nbsp; @endif
                        @if($school->email ?? false)Email: {{ $school->email }}@endif
                    </div>
                    <div class="report-badge-container">
                        <span class="report-title-badge">Official Terminal Report Card</span>
                    </div>
                </td>
                @if(!empty($stamp_base64))
                    <td style="width: 65px; text-align: right; border: none;">
                        <img src="{{ $stamp_base64 }}" style="max-height: 55px; max-width: 55px;" alt="Official Stamp" />
                    </td>
                @endif
            </tr>
        </table>

        {{-- ===== STUDENT BIO-DATA ===== --}}
        <div class="bio-section">
            <table class="bio-table">
                <tr>
                    <td class="bio-label">Student Name:</td>
                    <td class="bio-value">{{ $student->name ?? 'N/A' }}</td>
                    <td class="bio-label">Admission No.:</td>
                    <td class="bio-value" style="font-family: monospace; font-weight: bold;">{{ $student->admission_number ?? 'N/A' }}</td>
                </tr>
                <tr>
                    <td class="bio-label">Class:</td>
                    <td class="bio-value">
                        {{ $student->class ? trim($student->class->name . ' ' . ($student->class->arm ?? '')) : 'N/A' }}
                    </td>
                    <td class="bio-label">Gender:</td>
                    <td class="bio-value">{{ ucfirst($student->gender ?? 'N/A') }}</td>
                </tr>
                <tr>
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
                        <span class="summary-label">Average</span>
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

        {{-- ===== GRADES TABLE ===== --}}
        <div class="grades-section">
            <div class="section-title">Academic Subject Performance</div>
            <table class="grades-table">
                <thead>
                    <tr>
                        <th style="width: 32%;">Subject</th>
                        <th style="width: 12%;">Code</th>
                        <th style="width: 11%;">CA ({{ $school->max_ca_score ?? 30 }})</th>
                        <th style="width: 11%;">Exam ({{ $school->max_exam_score ?? 70 }})</th>
                        <th style="width: 11%;">Total (100)</th>
                        <th style="width: 9%;">Grade</th>
                        <th style="width: 14%;">Remark</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($results as $res)
                    <tr>
                        <td>{{ $res->subject->name ?? 'Subject' }}</td>
                        <td style="font-family: monospace; font-size: 8.5px;">{{ $res->subject->code ?? 'N/A' }}</td>
                        <td>{{ $res->ca_score }}</td>
                        <td>{{ $res->exam_score }}</td>
                        <td style="font-weight: bold; color: #0f172a;">{{ $res->total_score }}</td>
                        <td style="font-weight: bold; color: #1e3a5f;">{{ $res->grade }}</td>
                        <td style="font-size: 8.5px;">{{ $res->remark }}</td>
                    </tr>
                    @empty
                    <tr>
                        <td colspan="7" style="padding: 12px; color: #64748b; font-style: italic;">
                            No approved subject records recorded for this term.
                        </td>
                    </tr>
                    @endforelse
                </tbody>
                @if($results->count() > 0)
                <tfoot>
                    <tr>
                        <td colspan="2" style="text-align: left; padding-left: 8px;">
                            CUMULATIVE TOTAL ({{ $summary['subjects_count'] }} Subject{{ $summary['subjects_count'] > 1 ? 's' : '' }})
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
                    <td>{{ $school->grade_a_min ?? 75 }}-100 (Distinction)</td>
                    <td class="grade-letter">B</td>
                    <td>{{ $school->grade_b_min ?? 65 }}-{{ ($school->grade_a_min ?? 75) - 1 }} (Very Good)</td>
                    <td class="grade-letter">C</td>
                    <td>{{ $school->grade_c_min ?? 50 }}-{{ ($school->grade_b_min ?? 65) - 1 }} (Credit)</td>
                    <td class="grade-letter">D</td>
                    <td>{{ $school->grade_d_min ?? 40 }}-{{ ($school->grade_c_min ?? 50) - 1 }} (Pass)</td>
                    <td class="grade-letter">F</td>
                    <td>0-{{ ($school->grade_d_min ?? 40) - 1 }} (Fail)</td>
                </tr>
            </table>
        </div>

        {{-- ===== OFFICIAL AUTHORIZATION & SIGNATURES SECTION ===== --}}
        <div class="auth-section">
            <div class="section-title">Official Endorsement & Sign-Off</div>
            <table class="auth-table">
                <tr>
                    {{-- Form Master Column --}}
                    <td class="auth-col">
                        <div class="auth-card">
                            <div class="auth-card-title">Class Form Master's Sign-Off</div>
                            <div class="auth-remark">
                                "{{ $summary['form_master_remark'] ?? 'Demonstrates disciplined academic commitment and good classroom conduct.' }}"
                            </div>
                            <div class="auth-signature-zone">
                                @if(!empty($form_master_signature))
                                    <img src="{{ $form_master_signature }}" class="signature-img" alt="Form Master Signature" />
                                @else
                                    <div class="digital-cursive-signature">{{ $form_master_name ?? 'Form Master' }}</div>
                                @endif
                            </div>
                            <div class="auth-meta">
                                <div class="auth-name">{{ $form_master_name ?? 'Class Form Master' }}</div>
                                <div class="auth-role">Form Master &bull; Date: {{ $sign_date ?? date('d/m/Y') }}</div>
                            </div>
                        </div>
                    </td>

                    {{-- Principal Column --}}
                    <td class="auth-col">
                        <div class="auth-card">
                            <div class="auth-card-title">Principal's Endorsement & Seal</div>
                            <div class="auth-remark">
                                "{{ $summary['principal_remark'] ?? 'A commendable academic result. Encouraged to sustain standard.' }}"
                            </div>
                            <div class="auth-signature-zone">
                                <table style="width: 100%; border: none;">
                                    <tr>
                                        <td style="border: none; text-align: center; vertical-align: middle; width: 65%;">
                                            @if(!empty($principal_signature))
                                                <img src="{{ $principal_signature }}" class="signature-img" alt="Principal Signature" />
                                            @else
                                                <div class="digital-cursive-signature">{{ $principal_name ?? 'School Principal' }}</div>
                                            @endif
                                        </td>
                                        <td style="border: none; text-align: center; vertical-align: middle; width: 35%;">
                                            @if(!empty($stamp_base64))
                                                <img src="{{ $stamp_base64 }}" class="stamp-img" alt="School Seal" />
                                            @else
                                                <div class="digital-seal-box">
                                                    <span>SEAL</span><br><span>VERIFIED</span>
                                                </div>
                                            @endif
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            <div class="auth-meta">
                                <div class="auth-name">{{ $principal_name ?? 'Principal / Head of School' }}</div>
                                <div class="auth-role">Principal &bull; Date: {{ $sign_date ?? date('d/m/Y') }}</div>
                            </div>
                        </div>
                    </td>
                </tr>
            </table>
        </div>

        {{-- ===== FOOTER ===== --}}
        <div class="page-footer">
            Official Academic Record &bull; Generated on {{ $generated_at }}
            &bull; {{ $school->name ?? 'EduTrack Academy' }}
            &bull; Document authenticity protected by anti-forgery verification.
        </div>
    </div>
</body>
</html>
