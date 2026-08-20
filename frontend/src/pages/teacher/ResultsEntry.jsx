import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, ClipboardList, Send, CheckCircle2 } from 'lucide-react';
import resultService from '../../services/resultService';

const gradeScale = (score) => {
  if (score >= 75) return 'A1';
  if (score >= 70) return 'B2';
  if (score >= 65) return 'B3';
  if (score >= 60) return 'C4';
  if (score >= 55) return 'C5';
  if (score >= 50) return 'C6';
  if (score >= 45) return 'D7';
  if (score >= 40) return 'E8';
  return 'F9';
};

const ResultsEntry = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [term, setTerm] = useState('1');
  const [session, setSession] = useState('2024/2025');
  const [scores, setScores] = useState({}); // {studentId: {ca: '', exam: ''}}
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    resultService.getClasses().then(setClasses).catch(console.error);
    resultService.getSubjects().then(setSubjects).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedClass) {
      resultService.getStudents(selectedClass).then(setStudents).catch(console.error);
    } else {
      setStudents([]);
    }
  }, [selectedClass]);

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
      toast.error('Please fill all header selection fields (Class, Subject, Term, Session).');
      return;
    }
    const payloads = students.map((s) => {
      const entry = scores[s.id] || {};
      const ca = parseFloat(entry.ca) || 0;
      const exam = parseFloat(entry.exam) || 0;
      const total = ca + exam;
      const grade = gradeScale(total);
      return {
        student_id: s.id,
        subject_id: selectedSubject,
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
      for (const payload of payloads) {
        await resultService.createResult(payload);
      }
      toast.success('All student grades submitted successfully for approval!');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      console.error(err);
      const errMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        (err?.response?.data && typeof err.response.data === 'object'
          ? Object.values(err.response.data).flat().join(' ')
          : null) ||
        'Error submitting results. Check your entries and try again.';
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }} className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '40px' }}>
        
        <div style={{ marginBottom: '30px', borderBottom: '1px solid var(--border-dark)', paddingBottom: '20px' }}>
          <button onClick={() => navigate('/dashboard')} className="back-link" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <ArrowLeft size={16} /> Back to Dashboard
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

        {/* Selection Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px', background: 'rgba(0,0,0,0.12)', padding: '20px', borderRadius: '14px', border: '1px solid var(--border-dark)' }}>
          <div>
            <label className="form-label">Class Placement</label>
            <select className="glass-input" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
              <option value="" style={{ color: '#000' }}>-- Select Class --</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id} style={{ color: '#000' }}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Subject</label>
            <select className="glass-input" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
              <option value="" style={{ color: '#000' }}>-- Select Subject --</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id} style={{ color: '#000' }}>{sub.name} ({sub.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Academic Term</label>
            <select className="glass-input" value={term} onChange={(e) => setTerm(e.target.value)}>
              <option value="1" style={{ color: '#000' }}>1st Term</option>
              <option value="2" style={{ color: '#000' }}>2nd Term</option>
              <option value="3" style={{ color: '#000' }}>3rd Term</option>
            </select>
          </div>

          <div>
            <label className="form-label">Academic Session</label>
            <input type="text" placeholder="e.g. 2024/2025" className="glass-input" value={session} onChange={(e) => setSession(e.target.value)} />
          </div>
        </div>

        {/* Score Entry Table */}
        {students.length > 0 ? (
          <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-dark)' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th style={{ textAlign: 'center', width: '130px' }}>CA Score (30)</th>
                  <th style={{ textAlign: 'center', width: '130px' }}>Exam Score (70)</th>
                  <th style={{ textAlign: 'center', width: '110px' }}>Total (100)</th>
                  <th style={{ textAlign: 'center', width: '110px' }}>WAEC Grade</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const total = calculateTotal(student.id);
                  const grade = gradeScale(total);
                  return (
                    <tr key={student.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'rgba(255, 123, 225, 0.2)', color: '#ff7be1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px' }}>
                            {student.name.charAt(0)}
                          </div>
                          <span style={{ fontWeight: '600' }}>{student.name}</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input 
                          type="number" 
                          min="0" 
                          max="40" 
                          className="glass-input" 
                          style={{ textAlign: 'center', padding: '8px' }} 
                          value={scores[student.id]?.ca || ''} 
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
                          style={{ textAlign: 'center', padding: '8px' }} 
                          value={scores[student.id]?.exam || ''} 
                          onChange={(e) => handleScoreChange(student.id, 'exam', e.target.value)} 
                          placeholder="0"
                        />
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: '800', fontSize: '16px' }}>{total}</td>
                      <td style={{ textAlign: 'center', fontWeight: '800', fontSize: '16px', color: '#00f2fe' }}>{grade}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <ClipboardList size={40} style={{ opacity: 0.3, marginBottom: '8px' }} />
            <p>Please select a Class and Subject above to populate the student score roster.</p>
          </div>
        )}

        <div style={{ marginTop: '32px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-cancel"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={students.length === 0 || submitting}
            className="btn-primary"
          >
            {submitting ? (
              <><span className="spinner spinner-sm"></span> Submitting...</>
            ) : (
              <><Send size={16} /> Submit Final Grades</>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ResultsEntry;
