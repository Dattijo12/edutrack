import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, ClipboardList, Send, AlertCircle, Loader2 } from 'lucide-react';
import resultService from '../../services/resultService';

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

  // Load classes and subjects on mount
  useEffect(() => {
    const loadDropdowns = async () => {
      setLoadingDropdowns(true);
      setDropdownError(null);
      try {
        const [classesData, subjectsData] = await Promise.all([
          resultService.getClasses(),
          resultService.getSubjects(),
        ]);
        // Ensure arrays (guard against unexpected API shapes)
        setClasses(Array.isArray(classesData) ? classesData : []);
        setSubjects(Array.isArray(subjectsData) ? subjectsData : []);

        // Pre-select from URL params (coming from "Open Gradebook" link)
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load students whenever selectedClass changes
  const fetchStudents = useCallback(async (classId) => {
    if (!classId) {
      setStudents([]);
      setStudentError(null);
      return;
    }
    setLoadingStudents(true);
    setStudentError(null);
    setStudents([]); // clear old list immediately
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

  const handleClassChange = (e) => {
    setSelectedClass(e.target.value);
    setScores({}); // reset scores when class changes
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

    const payloads = students.map((s) => {
      const entry = scores[s.id] || {};
      const ca = parseFloat(entry.ca) || 0;
      const exam = parseFloat(entry.exam) || 0;
      const total = ca + exam;
      const { grade } = gradeScale(total);
      return {
        student_id: s.id,
        subject_id: Number(selectedSubject),
        term,
        academic_session: session,
        ca_score: ca,
        exam_score: exam,
        total_score: total,
        grade,
      };
    });

    try {
      setSubmitting(true);
      let successCount = 0;
      for (const payload of payloads) {
        try {
          await resultService.createResult(payload);
          successCount++;
        } catch (err) {
          const studentName = students.find((s) => s.id === payload.student_id)?.name || 'Unknown';
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
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
        </div>

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
                  <th style={{ textAlign: 'center', width: '150px' }}>CA Score <span style={{ fontWeight: 400, opacity: 0.7 }}>(max 30)</span></th>
                  <th style={{ textAlign: 'center', width: '150px' }}>Exam Score <span style={{ fontWeight: 400, opacity: 0.7 }}>(max 70)</span></th>
                  <th style={{ textAlign: 'center', width: '110px' }}>Total</th>
                  <th style={{ textAlign: 'center', width: '100px' }}>Grade</th>
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
                  return (
                    <tr key={student.id}>
                      <td style={{ color: 'hsl(var(--text-secondary))', fontSize: '13px' }}>{idx + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(255, 123, 225, 0.2)', color: '#ff7be1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px', flexShrink: 0 }}>
                            {fullName.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: '600' }}>{fullName}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="number"
                          min="0"
                          max="30"
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
                          max="70"
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

      </div>
    </div>
  );
};

export default ResultsEntry;
