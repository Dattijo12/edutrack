import React, { useEffect, useState } from 'react';
import subjectService from '../../services/subjectService';
import classService from '../../services/classService';
import { Link } from 'react-router-dom';

const MySubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subRes, classRes] = await Promise.all([
          subjectService.getAll(),
          classService.getAll()
        ]);
        setSubjects(subRes);
        setClasses(classRes);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const getClassName = (classId) => {
    const cls = classes.find(c => c.id === classId);
    return cls ? cls.name : '';
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }} className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '40px' }}>
        <Link to="/dashboard" style={{ color: '#00f2fe', textDecoration: 'none', fontSize: '14px', marginBottom: '10px', display: 'inline-block' }}>&larr; Back to Dashboard</Link>
        <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>My Subjects</h2>
        <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '15px' }}>View student rolls and course outlines for your assigned classes.</p>

        {loading ? (
          <p style={{ textAlign: 'center', color: 'hsl(var(--text-secondary))', padding: '40px' }}>Loading subjects...</p>
        ) : subjects.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', background: 'rgba(0,0,0,0.15)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '16px' }}>No subjects assigned.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <tr>
                  <th style={{ padding: '16px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase', letterSpacing: '1px' }}>Subject</th>
                  <th style={{ padding: '16px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase', letterSpacing: '1px' }}>Code</th>
                  <th style={{ padding: '16px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase', letterSpacing: '1px' }}>Class</th>
                  <th style={{ padding: '16px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase', letterSpacing: '1px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((sub) => (
                  <tr key={sub.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px 16px' }}>{sub.name}</td>
                    <td style={{ padding: '12px 16px' }}>{sub.code || 'N/A'}</td>
                    <td style={{ padding: '12px 16px' }}>{getClassName(sub.class_id)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <Link to={`/teacher/subject/${sub.id}`} style={{ color: '#00f2fe', textDecoration: 'underline' }}>View Students / Outline</Link>
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

export default MySubjects;
