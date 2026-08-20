import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Layers, Eye } from 'lucide-react';
import subjectService from '../../services/subjectService';
import classService from '../../services/classService';

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
    return cls ? cls.name : 'All Classes';
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }} className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '40px' }}>
        
        <div style={{ marginBottom: '30px', borderBottom: '1px solid var(--border-dark)', paddingBottom: '20px' }}>
          <Link to="/dashboard" className="back-link">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(235, 92, 180, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={22} color="#ff7be1" />
            </div>
            <div>
              <h2 style={{ fontSize: '28px', fontWeight: '700' }}>My Assigned Subjects</h2>
              <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '14px', marginTop: '2px' }}>
                Course offerings and assigned student rolls.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="page-loading">
            <span className="spinner"></span>
            <p>Loading assigned subjects...</p>
          </div>
        ) : subjects.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p>No subjects assigned to your account yet.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-dark)' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subject Code</th>
                  <th>Subject Name</th>
                  <th>Class Level</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((sub) => (
                  <tr key={sub.id}>
                    <td style={{ fontWeight: '700', color: 'hsl(var(--accent))' }}>{sub.code || 'N/A'}</td>
                    <td style={{ fontWeight: '600' }}>{sub.name}</td>
                    <td>
                      <span className="badge badge-teacher">
                        <Layers size={12} style={{ display: 'inline', marginRight: '4px' }} />
                        {getClassName(sub.class_id)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link to={`/teacher/results-entry?subject=${sub.id}`} className="btn-edit">
                        <Eye size={14} /> Open Gradebook
                      </Link>
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
