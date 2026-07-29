import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import subjectService from '../../services/subjectService';

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentSubject, setCurrentSubject] = useState(null); // For editing
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const data = await subjectService.getAll();
      setSubjects(data);
    } catch (err) {
      setError('Failed to load subjects.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (sub = null) => {
    setCurrentSubject(sub);
    setName(sub ? sub.name : '');
    setCode(sub ? sub.code : '');
    setError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentSubject(null);
    setName('');
    setCode('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (currentSubject) {
        // Edit Subject
        await subjectService.update(currentSubject.id, { name, code });
      } else {
        // Add Subject
        await subjectService.create({ name, code });
      }
      fetchSubjects();
      handleCloseModal();
    } catch (err) {
      setError(
        err.response?.data?.message || 
        err.response?.data?.errors?.code?.[0] || 
        err.response?.data?.errors?.name?.[0] || 
        'Failed to save subject.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this subject? All associated grades will be permanently deleted.')) return;
    setError('');

    try {
      await subjectService.delete(id);
      fetchSubjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete subject.');
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto' }} className="animate-fade-in">
      {/* Navigation Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <Link to="/dashboard" style={{ color: 'hsl(var(--text-secondary))', textDecoration: 'none', fontSize: '14px' }}>
            &larr; Back to Dashboard
          </Link>
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginTop: '10px' }}>Manage Subjects</h1>
        </div>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          + Add New Subject
        </button>
      </div>

      {error && (
        <div style={{
          background: 'rgba(255, 75, 75, 0.15)',
          border: '1px solid rgba(255, 75, 75, 0.3)',
          borderRadius: '8px',
          padding: '12px 16px',
          color: '#ff6b6b',
          fontSize: '14px',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'hsl(var(--text-secondary))' }}>
          Loading subjects...
        </div>
      ) : (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(255, 255, 255, 0.02)' }}>
                <th style={{ padding: '16px 24px', color: 'hsl(var(--text-secondary))', fontSize: '13px', fontWeight: '600' }}>Subject Code</th>
                <th style={{ padding: '16px 24px', color: 'hsl(var(--text-secondary))', fontSize: '13px', fontWeight: '600' }}>Subject Name</th>
                <th style={{ padding: '16px 24px', color: 'hsl(var(--text-secondary))', fontSize: '13px', fontWeight: '600', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subjects.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ padding: '30px', textAlign: 'center', color: 'hsl(var(--text-secondary))' }}>
                    No subjects found. Add one to get started!
                  </td>
                </tr>
              ) : (
                subjects.map((sub) => (
                  <tr key={sub.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', transition: 'background 0.2s' }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '700', color: 'hsl(var(--accent))' }}>{sub.code}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '600' }}>{sub.name}</td>
                    <td style={{ padding: '16px 24px', textAlign: 'right', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => handleOpenModal(sub)}
                        style={{
                          background: 'rgba(92, 124, 250, 0.1)',
                          border: '1px solid rgba(92, 124, 250, 0.2)',
                          color: '#7b93ff',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px'
                        }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(sub.id)}
                        style={{
                          background: 'rgba(255, 75, 75, 0.1)',
                          border: '1px solid rgba(255, 75, 75, 0.2)',
                          color: '#ff6b6b',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px'
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Slide-in / Fade-in Modal Form */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '90%', maxWidth: '440px', padding: '30px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>
              {currentSubject ? 'Edit Subject' : 'Create Subject'}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'hsl(var(--text-secondary))', marginBottom: '6px' }}>
                  Subject Code
                </label>
                <input
                  type="text"
                  className="glass-input"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. MATH101"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'hsl(var(--text-secondary))', marginBottom: '6px' }}>
                  Subject Name
                </label>
                <input
                  type="text"
                  className="glass-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mathematics"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn-logout" onClick={handleCloseModal} style={{ border: 'none', background: 'rgba(255,255,255,0.06)', color: 'white' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subjects;
