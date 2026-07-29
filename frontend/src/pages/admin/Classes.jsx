import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import classService from '../../services/classService';

const Classes = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentClass, setCurrentClass] = useState(null); // For editing
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const data = await classService.getAll();
      setClasses(data);
    } catch (err) {
      setError('Failed to load classes.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (cls = null) => {
    setCurrentClass(cls);
    setName(cls ? cls.name : '');
    setError('');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentClass(null);
    setName('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      if (currentClass) {
        // Edit Class
        await classService.update(currentClass.id, { name });
      } else {
        // Add Class
        await classService.create({ name });
      }
      fetchClasses();
      handleCloseModal();
    } catch (err) {
      setError(
        err.response?.data?.message || 
        err.response?.data?.errors?.name?.[0] || 
        'Failed to save class.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this class?')) return;
    setError('');

    try {
      await classService.delete(id);
      fetchClasses();
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Failed to delete class. Make sure it has no registered students.'
      );
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
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginTop: '10px' }}>Manage Classes</h1>
        </div>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          + Add New Class
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
          Loading classes...
        </div>
      ) : (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(255, 255, 255, 0.02)' }}>
                <th style={{ padding: '16px 24px', color: 'hsl(var(--text-secondary))', fontSize: '13px', fontWeight: '600' }}>ID</th>
                <th style={{ padding: '16px 24px', color: 'hsl(var(--text-secondary))', fontSize: '13px', fontWeight: '600' }}>Class Name</th>
                <th style={{ padding: '16px 24px', color: 'hsl(var(--text-secondary))', fontSize: '13px', fontWeight: '600' }}>Student Count</th>
                <th style={{ padding: '16px 24px', color: 'hsl(var(--text-secondary))', fontSize: '13px', fontWeight: '600', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {classes.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: 'hsl(var(--text-secondary))' }}>
                    No classes found. Add one to get started!
                  </td>
                </tr>
              ) : (
                classes.map((cls) => (
                  <tr key={cls.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', transition: 'background 0.2s' }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '16px 24px', fontSize: '14px' }}>{cls.id}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '600' }}>{cls.name}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px' }}>
                      <span style={{
                        padding: '3px 8px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}>
                        {cls.students_count || 0} Students
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => handleOpenModal(cls)}
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
                        onClick={() => handleDelete(cls.id)}
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
              {currentClass ? 'Edit Class' : 'Create Class'}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'hsl(var(--text-secondary))', marginBottom: '6px' }}>
                  Class Name
                </label>
                <input
                  type="text"
                  className="glass-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Grade 10-A"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn-logout" onClick={handleCloseModal} style={{ border: 'none', background: 'rgba(255,255,255,0.06)', color: 'white' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Classes;
