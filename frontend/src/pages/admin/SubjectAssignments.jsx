import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import classService from '../../services/classService';
import subjectService from '../../services/subjectService';

const SubjectAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [teacherId, setTeacherId] = useState('');
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assigns, staff, cls, subs] = await Promise.all([
        adminService.getSubjectAssignments(),
        adminService.getUsers('teacher'),
        classService.getAll(),
        subjectService.getAll(),
      ]);
      setAssignments(assigns);
      setTeachers(staff);
      setClasses(cls);
      setSubjects(subs);
    } catch (err) {
      console.error(err);
      setError('Failed to load assignment data.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!teacherId || !classId || !subjectId) {
      setError('Please select a teacher, class, and subject.');
      return;
    }

    try {
      await adminService.assignSubject({
        teacher_id: teacherId,
        class_id: classId,
        subject_id: subjectId,
      });
      setMessage('✅ Subject assigned to teacher successfully!');
      fetchData();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to assign subject.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this subject assignment?')) return;
    try {
      await adminService.deleteAssignment(id);
      setMessage('Assignment removed.');
      fetchData();
    } catch (err) {
      console.error(err);
      setError('Failed to remove assignment.');
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1100px', margin: '0 auto' }} className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '40px' }}>
        <Link to="/dashboard" style={{ color: '#00f2fe', textDecoration: 'none', fontSize: '14px', marginBottom: '15px', display: 'inline-block' }}>
          &larr; Back to Dashboard
        </Link>
        <h2 style={{ fontSize: '26px', fontWeight: '700', marginBottom: '8px' }}>Teacher Subject Allocations</h2>
        <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '14px', marginBottom: '30px' }}>
          Assign specific subjects and classes to teachers for score entry access.
        </p>

        {message && (
          <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(75,255,125,0.15)', color: '#4bff7d', fontSize: '14px', marginBottom: '20px' }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(255,75,75,0.15)', color: '#ff4b4b', fontSize: '14px', marginBottom: '20px' }}>
            ❌ {error}
          </div>
        )}

        {/* Assignment Form */}
        <form onSubmit={handleAssign} style={{ background: 'rgba(0,0,0,0.15)', padding: '25px', borderRadius: '12px', border: '1px solid var(--border-dark)', marginBottom: '35px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '15px' }}>Assign New Subject to Teacher</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>Select Teacher</label>
              <select className="glass-input" value={teacherId} onChange={(e) => setTeacherId(e.target.value)} required>
                <option value="" style={{ color: '#000' }}>-- Choose Teacher --</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id} style={{ color: '#000' }}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>Select Class</label>
              <select className="glass-input" value={classId} onChange={(e) => setClassId(e.target.value)} required>
                <option value="" style={{ color: '#000' }}>-- Choose Class --</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id} style={{ color: '#000' }}>{c.name} {c.arm}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>Select Subject</label>
              <select className="glass-input" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} required>
                <option value="" style={{ color: '#000' }}>-- Choose Subject --</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id} style={{ color: '#000' }}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>

            <div>
              <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                Assign Subject
              </button>
            </div>
          </div>
        </form>

        {/* Existing Allocations List */}
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '15px' }}>Current Allocations</h3>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'hsl(var(--text-secondary))', padding: '30px' }}>Loading allocations...</p>
        ) : assignments.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', background: 'rgba(0,0,0,0.1)', borderRadius: '12px', border: '1px dashed var(--border-dark)' }}>
            <p style={{ color: 'hsl(var(--text-secondary))' }}>No subject allocations created yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-dark)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: 'var(--table-header-bg)', borderBottom: '1px solid var(--border-dark)' }}>
                <tr>
                  <th style={{ padding: '14px 18px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>Teacher</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>Class</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>Subject</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map(a => (
                  <tr key={a.id} style={{ borderBottom: '1px solid var(--border-dark)' }}>
                    <td style={{ padding: '14px 18px', fontWeight: '600' }}>{a.teacher?.name}</td>
                    <td style={{ padding: '14px 18px' }}>{a.school_class?.name} {a.school_class?.arm}</td>
                    <td style={{ padding: '14px 18px' }}>{a.subject?.name} ({a.subject?.code})</td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <button onClick={() => handleDelete(a.id)} style={{ background: 'none', border: 'none', color: '#ff4b4b', cursor: 'pointer', fontWeight: '600' }}>
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
};

export default SubjectAssignments;
