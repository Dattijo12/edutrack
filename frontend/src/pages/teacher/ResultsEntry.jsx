import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import resultService from '../../services/resultService';

const gradeScale = (score) => {
  if (score >= 70) return 'A';
  if (score >= 60) return 'B';
  if (score >= 50) return 'C';
  if (score >= 45) return 'D';
  if (score >= 40) return 'E';
  return 'F';
};

const ResultsEntry = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [term, setTerm] = useState('');
  const [session, setSession] = useState('');
  const [scores, setScores] = useState({}); // {studentId: {ca: '', exam: ''}}
  const [message, setMessage] = useState('');
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
      setMessage('Please fill all header fields.');
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
      setMessage('✅ All results submitted! Redirecting to dashboard...');
      setTimeout(() => navigate('/dashboard'), 1800);
    } catch (err) {
      console.error(err);
      const errMsg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        (err?.response?.data && typeof err.response.data === 'object'
          ? Object.values(err.response.data).flat().join(' ')
          : null) ||
        'Error submitting results. Check your entries and try again.';
      setMessage('❌ ' + errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }} className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '40px' }}>
        <div style={{ marginBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>Gradebook Entry</h2>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '15px' }}>Select a class and subject to input student scores.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase', letterSpacing: '1px' }}>Class</label>
            <select className="glass-input" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
              <option value="" style={{ color: '#000' }}>-- Select Class --</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id} style={{ color: '#000' }}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase', letterSpacing: '1px' }}>Subject</label>
            <select className="glass-input" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
              <option value="" style={{ color: '#000' }}>-- Select Subject --</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id} style={{ color: '#000' }}>{sub.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase', letterSpacing: '1px' }}>Term</label>
            <input type="text" placeholder="e.g. 1" className="glass-input" value={term} onChange={(e) => setTerm(e.target.value)} />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase', letterSpacing: '1px' }}>Session</label>
            <input type="text" placeholder="e.g. 2024/2025" className="glass-input" value={session} onChange={(e) => setSession(e.target.value)} />
          </div>
        </div>

        {students.length > 0 ? (
          <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <tr>
                  <th style={{ padding: '16px 20px', fontSize: '13px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase', letterSpacing: '1px' }}>Student Name</th>
                  <th style={{ padding: '16px 20px', fontSize: '13px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center', width: '120px' }}>CA (40)</th>
                  <th style={{ padding: '16px 20px', fontSize: '13px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center', width: '120px' }}>Exam (60)</th>
                  <th style={{ padding: '16px 20px', fontSize: '13px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center', width: '100px' }}>Total</th>
                  <th style={{ padding: '16px 20px', fontSize: '13px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center', width: '100px' }}>Grade</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student, index) => {
                  const total = calculateTotal(student.id);
                  const grade = gradeScale(total);
                  const isLast = index === students.length - 1;
                  return (
                    <tr key={student.id} style={{ borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255, 123, 225, 0.2)', color: '#ff7be1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '12px' }}>
                            {student.name.charAt(0)}
                          </div>
                          <span style={{ fontWeight: '500', color: 'hsl(var(--text-primary))' }}>{student.name}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                        <input type="number" min="0" max="40" className="glass-input" style={{ textAlign: 'center', padding: '8px' }} value={scores[student.id]?.ca || ''} onChange={(e) => handleScoreChange(student.id, 'ca', e.target.value)} />
                      </td>
                      <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                        <input type="number" min="0" max="60" className="glass-input" style={{ textAlign: 'center', padding: '8px' }} value={scores[student.id]?.exam || ''} onChange={(e) => handleScoreChange(student.id, 'exam', e.target.value)} />
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'center', fontWeight: '700', fontSize: '16px' }}>{total}</td>
                      <td style={{ padding: '16px 20px', textAlign: 'center', fontWeight: '800', fontSize: '16px', color: '#00f2fe' }}>{grade}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '60px 20px', textAlign: 'center', background: 'rgba(0,0,0,0.15)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '15px' }}>Please select a class to load students for grading.</p>
          </div>
        )}

        <div style={{ marginTop: '40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            {message && (
              <div style={{ padding: '10px 16px', borderRadius: '8px', background: message.includes('Error') || message.includes('fill') ? 'rgba(255,75,75,0.15)' : 'rgba(75,255,125,0.15)', color: message.includes('Error') || message.includes('fill') ? '#ff4b4b' : '#4bff7d', fontSize: '14px', fontWeight: '500' }}>
                {message}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={handleSubmit}
              disabled={students.length === 0 || submitting}
              className="btn-primary"
              style={{ opacity: (students.length === 0 || submitting) ? 0.6 : 1, cursor: (students.length === 0 || submitting) ? 'not-allowed' : 'pointer' }}
            >
              {submitting ? 'Submitting...' : 'Submit Final Grades'}
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-primary"
              style={{ background: 'rgba(92,124,250,0.2)', border: '1px solid rgba(92,124,250,0.3)' }}
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsEntry;
