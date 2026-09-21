import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, ClipboardList, Send, AlertCircle, Loader2, Upload, Download, AlertTriangle, Pencil, CheckCircle2, X } from 'lucide-react';
import resultService from '../../services/resultService';
import { useSchool } from '../../context/SchoolContext';
import BulkUploadModal from '../../components/teacher/BulkUploadModal';

const gradeScale = (score) => {
  if (score >= 75) return { grade: 'A1', color: '#00e676' };
  if (score >= 70) return { grade: 'B2', color: '#69f0ae' };
  if (score >= 65) return { grade: 'B3', color: '#b9f6ca' };
  if (score >= 60) return { grade: 'C4', color: '#00b0ff' };
  if (score >= 55) return { grade: 'C5', color: '#40c4ff' };
  if (score >= 50) return { grade: 'C6', color: '#80d8ff' };
  if (score >= 45) return { grade: 'D7', color: '#ffab40' };
  if (score >= 40) return { grade: 'E8', color: '#ff6d00' };
  return { grade: 'F9', color: '#ff1744' };
};

const ResultsEntry = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { school } = useSchool();

  // Dropdowns data
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [dropdownError, setDropdownError] = useState(null);

  // Student table data
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentError, setStudentError] = useState(null);

  // Selections
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [term, setTerm] = useState('1');
  const [session, setSession] = useState('2024/2025');

  // Scores: { [studentId]: { ca: string, exam: string } }
  const [scores, setScores] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [rejectedAlerts, setRejectedAlerts] = useState([]);

  // Edit Correction Modal state for resubmitting rejected results
  const [editingResult, setEditingResult] = useState(null);
  const [editCa, setEditCa] = useState('');
  const [editExam, setEditExam] = useState('');
  const [submittingCorrection, setSubmittingCorrection] = useState(false);

  // Fetch teacher's rejected result notifications
  const fetchAlerts = useCallback(async () => {
    try {
      const res = await resultService.getRejectedResults();
      setRejectedAlerts(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Failed to fetch rejected score alerts:', err);
    }
  }, []);

  // Load classes, subjects, and rejected alerts on mount
  useEffect(() => {
    const loadDropdowns = async () => {
      setLoadingDropdowns(true);
      setDropdownError(null);
      try {
        const [classesData, subjectsData] = await Promise.all([
          resultService.getClasses(),
          resultService.getSubjects(),
        ]);
        setClasses(Array.isArray(classesData) ? classesData : []);
        setSubjects(Array.isArray(subjectsData) ? subjectsData : []);

        const urlClass = searchParams.get('class');
        const urlSubject = searchParams.get('subject');
        if (urlClass) setSelectedClass(urlClass);
        if (urlSubject) setSelectedSubject(urlSubject);
      } catch (err) {
        console.error('Failed to load dropdown data:', err);
        setDropdownError('Failed to load classes and subjects. Please refresh the page.');
      } finally {
        setLoadingDropdowns(false);
      }
    };

    loadDropdowns();
    fetchAlerts();
  }, [fetchAlerts, searchParams]);

  // Open correction modal for a specific rejected result
  const handleOpenEditCorrection = (res) => {
    setEditingResult(res);
    setEditCa(res.ca_score !== null && res.ca_score !== undefined ? String(res.ca_score) : '');
    setEditExam(res.exam_score !== null && res.exam_score !== undefined ? String(res.exam_score) : '');
  };

  // Submit corrected scores for a single rejected result via PUT /teacher/results/{id}
  const handleSaveCorrection = async (e) => {
    if (e) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }
    if (!editingResult) return;

    const ca = parseFloat(editCa) || 0;
    const exam = parseFloat(editExam) || 0;

    const maxCa = school?.max_ca_score || 30;
    const maxExam = school?.max_exam_score || 70;

    if (ca < 0 || ca > maxCa) {
      toast.error(`CA score must be between 0 and ${maxCa}.`);
      return;
    }
    if (exam < 0 || exam > maxExam) {
      toast.error(`Exam score must be between 0 and ${maxExam}.`);
      return;
    }

    try {
      setSubmittingCorrection(true);
      // Explicitly call resultService.updateResult(id, payload) using PUT request
      await resultService.updateResult(editingResult.id, {
        ca_score: ca,
        exam_score: exam,
      });

      toast.success('Corrected score entry resubmitted for approval successfully!');
      setEditingResult(null);
      // Immediately refresh rejected results list to update UI state
      await fetchAlerts();
    } catch (err) {
      console.error('Failed to update result:', err);
      const msg = err?.response?.data?.message || 'Failed to update result entry.';
      toast.error(msg);
    } finally {
      setSubmittingCorrection(false);
    }
  };

  // Submit correction for a single student directly from table row
  const handleSaveCorrectionRow = async (e, studentId, resultId) => {
    if (e) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }
    const entry = scores[studentId] || {};
    const ca = parseFloat(entry.ca) || 0;
    const exam = parseFloat(entry.exam) || 0;

    const maxCa = school?.max_ca_score || 30;
    const maxExam = school?.max_exam_score || 70;

    if (ca < 0 || ca > maxCa) {
      toast.error(`CA score must be between 0 and ${maxCa}.`);
      return;
    }
    if (exam < 0 || exam > maxExam) {
      toast.error(`Exam score must be between 0 and ${maxExam}.`);
      return;
    }

    try {
      setSubmittingCorrection(true);
      // Explicitly call resultService.updateResult(resultId, payload) via PUT request
      await resultService.updateResult(resultId, {
        ca_score: ca,
        exam_score: exam,
      });

      toast.success('Corrected score entry resubmitted for approval successfully!');
      await fetchAlerts();
    } catch (err) {
      console.error('Failed to update result:', err);
      const msg = err?.response?.data?.message || 'Failed to update result entry.';
      toast.error(msg);
    } finally {
      setSubmittingCorrection(false);
    }
  };

  // Load students whenever selectedClass changes
  const fetchStudents = useCallback(async (classId) => {
    if (!classId) {
      setStudents([]);
      setStudentError(null);
      return;
    }
    setLoadingStudents(true);
    setStudentError(null);
    setStudents([]);
    try {
      const data = await resultService.getStudents(classId);
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load students:', err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to load students for selected class.';
      setStudentError(msg);
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents(selectedClass);
  }, [selectedClass, fetchStudents]);

  // Pre-fill scores for flagged/rejected students when roster or alerts change
  useEffect(() => {
    if (students.length > 0 && selectedSubject && rejectedAlerts.length > 0) {
      setScores((prev) => {
        const next = { ...prev };
        students.forEach((s) => {
          const rejected = rejectedAlerts.find(
            (r) => Number(r.student_id) === Number(s.id) && Number(r.subject_id) === Number(selectedSubject)
          );
          if (rejected && !next[s.id]) {
            next[s.id] = {
              ca: rejected.ca_score !== null && rejected.ca_score !== undefined ? String(rejected.ca_score) : '',
              exam: rejected.exam_score !== null && rejected.exam_score !== undefined ? String(rejected.exam_score) : '',
            };
          }
        });
        return next;
      });
    }
  }, [students, selectedSubject, rejectedAlerts]);

  const handleClassChange = (e) => {
    setSelectedClass(e.target.value);
    setScores({});
  };

  const handleScoreChange = (studentId, field, value) => {
    setScores((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
  };

  const calculateTotal = (studentId) => {
    const entry = scores[studentId] || {};
    const ca = parseFloat(entry.ca) || 0;
    const exam = parseFloat(entry.exam) || 0;
    return ca + exam;
  };

  const handleSubmit = async () => {
    if (!selectedClass || !selectedSubject || !term || !session) {
      toast.error('Please select a Class, Subject, Term, and Academic Session before submitting.');
      return;
    }
    if (students.length === 0) {
      toast.error('No students found in the selected class.');
      return;
    }

    try {
      setSubmitting(true);
      let successCount = 0;
      for (const s of students) {
        const entry = scores[s.id] || {};
        const ca = parseFloat(entry.ca) || 0;
        const exam = parseFloat(entry.exam) || 0;
        const total = ca + exam;
        const { grade } = gradeScale(total);

        // Robust numeric check to match existing rejected result record for this student and subject
        const existingRejected = rejectedAlerts.find(
          (r) => Number(r.student_id) === Number(s.id) && Number(r.subject_id) === Number(selectedSubject)
        );

        try {
          if (existingRejected) {
            // Explicitly call updateResult(resultId, payload) via PUT request
            await resultService.updateResult(existingRejected.id, {
              ca_score: ca,
              exam_score: exam,
            });
          } else {
            // Create new result entry via POST request
            await resultService.createResult({
              student_id: s.id,
              subject_id: Number(selectedSubject),
              term,
              academic_session: session,
              ca_score: ca,
              exam_score: exam,
              total_score: total,
              grade,
            });
          }
          successCount++;
        } catch (err) {
          const studentName = s.name || `${s.first_name || ''} ${s.last_name || ''}` || 'Unknown';
          const errMsg =
            err?.response?.data?.message ||
            (err?.response?.data && typeof err.response.data === 'object'
              ? Object.values(err.response.data).flat().join('; ')
              : null) ||
            `Failed to submit result for ${studentName}.`;
          toast.error(errMsg);
        }
      }
      if (successCount > 0) {
        toast.success(`${successCount} of ${students.length} student grade(s) submitted for approval!`);
        await fetchAlerts();
        setTimeout(() => navigate('/dashboard'), 1800);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Render a loading state for dropdowns
  if (loadingDropdowns) {
    return (
      <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }} className="animate-fade-in">
        <div className="glass-panel" style={{ padding: '40px' }}>
          <div className="page-loading">
            <span className="spinner"></span>
            <p>Loading gradebook configuration...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }} className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '40px' }}>

        {/* Page Header */}
        <div style={{ marginBottom: '30px', borderBottom: '1px solid var(--border-dark)', paddingBottom: '20px' }}>
          <button
            onClick={() => navigate(-1)}
            className="back-link"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(235, 92, 180, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ClipboardList size={22} color="#ff7be1" />
              </div>
              <div>
                <h2 style={{ fontSize: '28px', fontWeight: '700' }}>Gradebook Entry</h2>
                <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '14px', marginTop: '2px' }}>
                  Input CA and Exam scores to calculate student WAEC/NECO grades.
                </p>
              </div>
            </div>

            {/* CSV Template Download & Bulk Upload Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await resultService.downloadTemplate(selectedClass);
                    toast.success('Result entry CSV template downloaded successfully!');
                  } catch (err) {
                    toast.error(err?.message || 'Failed to download template. Please try again.');
                  }
                }}
                className="btn-cancel"
                style={{ padding: '8px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
                title="Download CSV template for result entry"
              >
                <Download size={15} /> Template (.CSV)
              </button>

              <button
                type="button"
                onClick={() => setIsBulkModalOpen(true)}
                className="btn-primary"
                style={{ padding: '8px 16px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Upload size={15} /> Bulk Upload CSV
              </button>
            </div>
          </div>
        </div>

        {/* Rejection Alert Banner for Teachers */}
        {rejectedAlerts.length > 0 && (
          <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(255, 75, 75, 0.08)', border: '1px solid rgba(255, 75, 75, 0.3)', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <AlertTriangle size={22} color="#ff4b4b" />
              <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#ff4b4b' }}>
                Action Required: {rejectedAlerts.length} Score Entry Submission(s) Flagged for Correction
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {rejectedAlerts.map(res => (
                <div key={res.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '14px 16px', borderRadius: '8px', border: '1px solid rgba(255,75,75,0.2)' }}>
                  <div>
                    <span style={{ fontWeight: '700', color: '#ff7be1' }}>{res.subject?.name}</span>
                    {' • '}
                    <span style={{ fontWeight: '600' }}>Class: {res.schoolClass?.name || res.student?.class?.name} {res.schoolClass?.arm || res.student?.class?.arm}</span>
                    {' • '}
                    <span>Student: {res.student?.name || `${res.student?.first_name || ''} ${res.student?.last_name || ''}`} ({res.student?.admission_number})</span>
                    <p style={{ color: '#ff6b6b', marginTop: '4px', fontSize: '13px', fontStyle: 'italic' }}>
                      <strong>Reason for Rejection:</strong> "{res.rejection_reason || 'Score requires verification.'}"
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      if (e) {
                        if (typeof e.preventDefault === 'function') e.preventDefault();
                        if (typeof e.stopPropagation === 'function') e.stopPropagation();
                      }
                      handleOpenEditCorrection(res);
                    }}
                    className="btn-primary"
                    style={{ background: '#ff4b4b', padding: '6px 14px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}
                  >
                    <Pencil size={14} /> Edit & Resubmit
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dropdown Error Banner */}
        {dropdownError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', borderRadius: '10px', background: 'rgba(255, 59, 59, 0.12)', border: '1px solid rgba(255, 59, 59, 0.3)', marginBottom: '24px' }}>
            <AlertCircle size={18} color="#ff6b6b" />
            <span style={{ color: '#ff6b6b', fontSize: '14px' }}>{dropdownError}</span>
          </div>
        )}

        {/* Selection Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px', background: 'rgba(0,0,0,0.12)', padding: '20px', borderRadius: '14px', border: '1px solid var(--border-dark)' }}>
          {/* Class dropdown */}
          <div>
            <label className="form-label">Class Placement</label>
            <select
              className="glass-input"
              value={selectedClass}
              onChange={handleClassChange}
              disabled={loadingDropdowns}
            >
              <option value="" style={{ color: '#000' }}>-- Select Class --</option>
              {classes.map((c) => (
                <option key={c.id} value={String(c.id)} style={{ color: '#000' }}>
                  {c.name} {c.arm ? `(Arm ${c.arm})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Subject dropdown */}
          <div>
            <label className="form-label">Subject</label>
            <select
              className="glass-input"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={loadingDropdowns}
            >
              <option value="" style={{ color: '#000' }}>-- Select Subject --</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={String(sub.id)} style={{ color: '#000' }}>
                  {sub.name}{sub.code ? ` (${sub.code})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Term */}
          <div>
            <label className="form-label">Academic Term</label>
            <select className="glass-input" value={term} onChange={(e) => setTerm(e.target.value)}>
              <option value="1" style={{ color: '#000' }}>1st Term</option>
              <option value="2" style={{ color: '#000' }}>2nd Term</option>
              <option value="3" style={{ color: '#000' }}>3rd Term</option>
            </select>
          </div>

          {/* Session */}
          <div>
            <label className="form-label">Academic Session</label>
            <input
              type="text"
              placeholder="e.g. 2024/2025"
              className="glass-input"
              value={session}
              onChange={(e) => setSession(e.target.value)}
            />
          </div>
        </div>

        {/* Student Score Table */}
        {loadingStudents ? (
          <div className="page-loading">
            <Loader2 size={32} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: '10px' }}>Loading students for selected class...</p>
          </div>
        ) : studentError ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px 20px', borderRadius: '10px', background: 'rgba(255, 59, 59, 0.1)', border: '1px solid rgba(255, 59, 59, 0.25)', marginBottom: '20px' }}>
            <AlertCircle size={18} color="#ff6b6b" />
            <div>
              <p style={{ color: '#ff6b6b', fontWeight: '600', fontSize: '14px' }}>{studentError}</p>
              <button
                onClick={() => fetchStudents(selectedClass)}
                style={{ marginTop: '6px', background: 'none', border: 'none', color: '#7b93ff', cursor: 'pointer', fontSize: '13px', padding: 0, textDecoration: 'underline' }}
              >
                Try again
              </button>
            </div>
          </div>
        ) : students.length > 0 ? (
          <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-dark)' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student Name</th>
                  <th style={{ textAlign: 'center', width: '140px' }}>CA Score <span style={{ fontWeight: 400, opacity: 0.7 }}>(max {school?.max_ca_score || 30})</span></th>
                  <th style={{ textAlign: 'center', width: '140px' }}>Exam Score <span style={{ fontWeight: 400, opacity: 0.7 }}>(max {school?.max_exam_score || 70})</span></th>
                  <th style={{ textAlign: 'center', width: '90px' }}>Total</th>
                  <th style={{ textAlign: 'center', width: '90px' }}>Grade</th>
                  <th style={{ textAlign: 'center', width: '140px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, idx) => {
                  const total = calculateTotal(student.id);
                  const { grade, color } = gradeScale(total);
                  // Support both computed 'name' and raw 'first_name'/'last_name' fields
                  const fullName = student.name
                    || `${student.first_name || ''} ${student.last_name || ''}`.trim()
                    || 'Student';
                  
                  const existingRejected = rejectedAlerts.find(
                    (r) => Number(r.student_id) === Number(student.id) && Number(r.subject_id) === Number(selectedSubject)
                  );

                  return (
                    <tr key={student.id} style={existingRejected ? { background: 'rgba(255,75,75,0.06)' } : {}}>
                      <td style={{ color: 'hsl(var(--text-secondary))', fontSize: '13px' }}>{idx + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: existingRejected ? 'rgba(255, 75, 75, 0.2)' : 'rgba(255, 123, 225, 0.2)', color: existingRejected ? '#ff4b4b' : '#ff7be1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px', flexShrink: 0 }}>
                            {fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span style={{ fontWeight: '600' }}>{fullName}</span>
                            {existingRejected && (
                              <span style={{ marginLeft: '8px', fontSize: '11px', background: 'rgba(255,75,75,0.2)', color: '#ff4b4b', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                Needs Correction
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="number"
                          min="0"
                          max={school?.max_ca_score || 30}
                          className="glass-input"
                          style={{ textAlign: 'center', padding: '8px', width: '100%' }}
                          value={scores[student.id]?.ca ?? ''}
                          onChange={(e) => handleScoreChange(student.id, 'ca', e.target.value)}
                          placeholder="0"
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="number"
                          min="0"
                          max={school?.max_exam_score || 70}
                          className="glass-input"
                          style={{ textAlign: 'center', padding: '8px', width: '100%' }}
                          value={scores[student.id]?.exam ?? ''}
                          onChange={(e) => handleScoreChange(student.id, 'exam', e.target.value)}
                          placeholder="0"
                        />
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: '800', fontSize: '18px' }}>{total}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ fontWeight: '800', fontSize: '16px', color }}>
                          {grade}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {existingRejected ? (
                          <button
                            type="button"
                            onClick={(e) => handleSaveCorrectionRow(e, student.id, existingRejected.id)}
                            className="btn-primary"
                            disabled={submittingCorrection}
                            style={{ background: '#ff4b4b', padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <CheckCircle2 size={13} /> Resubmit
                          </button>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'hsl(var(--text-secondary))' }}>Ready</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : selectedClass ? (
          <div className="empty-state">
            <ClipboardList size={40} style={{ opacity: 0.3, marginBottom: '8px' }} />
            <p>No students found in the selected class.</p>
            <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', marginTop: '4px' }}>
              Students must be enrolled in this class by the administrator first.
            </p>
          </div>
        ) : (
          <div className="empty-state">
            <ClipboardList size={40} style={{ opacity: 0.3, marginBottom: '8px' }} />
            <p>Select a Class and Subject above to load the student score roster.</p>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ marginTop: '32px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={() => navigate('/dashboard')} className="btn-cancel">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={students.length === 0 || submitting || !selectedClass || !selectedSubject}
            className="btn-primary"
          >
            {submitting ? (
              <><span className="spinner spinner-sm"></span> Submitting...</>
            ) : (
              <><Send size={16} /> Submit Grades for Approval</>
            )}
          </button>
        </div>

        {/* CSV Bulk Upload Modal */}
        <BulkUploadModal
          isOpen={isBulkModalOpen}
          onClose={() => setIsBulkModalOpen(false)}
          selectedSubject={selectedSubject}
          selectedClass={selectedClass}
          term={term}
          session={session}
          onSuccess={() => fetchStudents(selectedClass)}
        />

        {/* Edit Rejected Result Modal */}
        {editingResult && (
          <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
            <div className="modal-content glass-panel animate-scale-in" style={{ width: '100%', maxWidth: '520px', padding: '32px', borderRadius: '16px', border: '1px solid var(--border-dark)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid var(--border-dark)', paddingBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(255, 75, 75, 0.15)', color: '#ff4b4b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Pencil size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Correct Rejected Score</h3>
                    <p style={{ fontSize: '12px', color: 'hsl(var(--text-secondary))' }}>
                      Resubmit updated CA and Exam scores to Exam Officer
                    </p>
                  </div>
                </div>
                <button onClick={() => setEditingResult(null)} style={{ background: 'none', border: 'none', color: 'hsl(var(--text-secondary))', cursor: 'pointer', padding: '4px' }}>
                  <X size={20} />
                </button>
              </div>

              {/* Student & Subject Header Info */}
              <div style={{ background: 'rgba(0,0,0,0.2)', padding: '14px', borderRadius: '10px', marginBottom: '18px', border: '1px solid var(--border-dark)' }}>
                <p style={{ fontSize: '14px', fontWeight: '700', color: 'hsl(var(--text-primary))' }}>
                  Student: {editingResult.student?.name || `${editingResult.student?.first_name || ''} ${editingResult.student?.last_name || ''}`} ({editingResult.student?.admission_number})
                </p>
                <p style={{ fontSize: '13px', color: '#ff7be1', marginTop: '4px', fontWeight: '600' }}>
                  Subject: {editingResult.subject?.name} | Class: {editingResult.schoolClass?.name || editingResult.student?.class?.name} {editingResult.schoolClass?.arm || editingResult.student?.class?.arm}
                </p>
              </div>

              {/* Rejection Reason Warning */}
              <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(255, 75, 75, 0.1)', border: '1px solid rgba(255, 75, 75, 0.3)', marginBottom: '20px' }}>
                <p style={{ color: '#ff4b4b', fontSize: '13px', fontStyle: 'italic', margin: 0 }}>
                  <strong>Exam Officer Reason:</strong> "{editingResult.rejection_reason || 'Score requires verification.'}"
                </p>
              </div>

              <form onSubmit={(e) => { if (e) { e.preventDefault(); e.stopPropagation(); } handleSaveCorrection(e); }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label className="form-label">
                      CA Score (max {school?.max_ca_score || 30})
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={school?.max_ca_score || 30}
                      className="glass-input"
                      value={editCa}
                      onChange={(e) => setEditCa(e.target.value)}
                      placeholder="0"
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">
                      Exam Score (max {school?.max_exam_score || 70})
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={school?.max_exam_score || 70}
                      className="glass-input"
                      value={editExam}
                      onChange={(e) => setEditExam(e.target.value)}
                      placeholder="0"
                      required
                    />
                  </div>
                </div>

                {/* Score Summary */}
                <div style={{ padding: '12px 16px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', border: '1px solid var(--border-dark)' }}>
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>Calculated Total & Grade:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '18px', fontWeight: '800' }}>
                      {(parseFloat(editCa) || 0) + (parseFloat(editExam) || 0)}
                    </span>
                    <span style={{ fontSize: '15px', fontWeight: '800', color: gradeScale((parseFloat(editCa) || 0) + (parseFloat(editExam) || 0)).color }}>
                      {gradeScale((parseFloat(editCa) || 0) + (parseFloat(editExam) || 0)).grade}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
                  <button type="button" onClick={() => setEditingResult(null)} className="btn-cancel" disabled={submittingCorrection}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleSaveCorrection(e)}
                    className="btn-primary"
                    disabled={submittingCorrection}
                    style={{ background: '#ff4b4b' }}
                  >
                    {submittingCorrection ? (
                      <><Loader2 size={16} className="spinner" style={{ animation: 'spin 1s linear infinite' }} /> Resubmitting...</>
                    ) : (
                      <><CheckCircle2 size={16} /> Resubmit for Approval</>
                    )}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default ResultsEntry;
