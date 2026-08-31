import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, BookOpen, Layers, Eye, AlertCircle } from 'lucide-react';
import resultService from '../../services/resultService';

const MySubjects = () => {
  const [assignments, setAssignments] = useState([]); // [{subject, class}]
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setError(null);
        // Use teacher-specific endpoints (not admin-only routes)
        const [subjects, classes] = await Promise.all([
          resultService.getSubjects(),
          resultService.getClasses(),
        ]);

        // Build a combined list pairing each subject with each class it's assigned to.
        // The teacher/subjects endpoint returns subjects the teacher is assigned to.
        // The teacher/classes endpoint returns the classes they are assigned to.
        // We display a row per subject-class pair.
        const rows = [];
        subjects.forEach((sub) => {
          classes.forEach((cls) => {
            rows.push({ subject: sub, schoolClass: cls });
          });
        });

        setAssignments(rows);
      } catch (err) {
        console.error(err);
        setError('Failed to load your subject assignments. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
                Your teaching assignments across classes. Click "Open Gradebook" to enter scores.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="page-loading">
            <span className="spinner"></span>
            <p>Loading assigned subjects...</p>
          </div>
        ) : error ? (
          <div className="empty-state" style={{ color: '#ff6b6b' }}>
            <AlertCircle size={48} style={{ opacity: 0.5, marginBottom: '12px' }} />
            <p>{error}</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
            <p>No subjects have been assigned to your account yet.</p>
            <p style={{ fontSize: '13px', marginTop: '6px', color: 'hsl(var(--text-secondary))' }}>
              Please contact the administrator to assign you a class and subject.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-dark)' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subject Name</th>
                  <th>Subject Code</th>
                  <th>Assigned Class / Arm</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((row, idx) => (
                  <tr key={`${row.subject.id}-${row.schoolClass.id}-${idx}`}>
                    <td style={{ fontWeight: '600' }}>{row.subject.name}</td>
                    <td style={{ fontWeight: '700', color: 'hsl(var(--accent))' }}>
                      {row.subject.code || 'N/A'}
                    </td>
                    <td>
                      <span className="badge badge-teacher">
                        <Layers size={12} style={{ display: 'inline', marginRight: '4px' }} />
                        {row.schoolClass.name} {row.schoolClass.arm && `(Arm ${row.schoolClass.arm})`}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link
                        to={`/teacher/results-entry?class=${row.schoolClass.id}&subject=${row.subject.id}`}
                        className="btn-edit"
                      >
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
