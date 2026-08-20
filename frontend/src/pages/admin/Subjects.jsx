import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Plus, Pencil, Trash2, BookOpen, Save, X } from 'lucide-react';
import subjectService from '../../services/subjectService';

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentSubject, setCurrentSubject] = useState(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const data = await subjectService.getAll();
      setSubjects(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load subjects.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (sub = null) => {
    setCurrentSubject(sub);
    setName(sub ? sub.name : '');
    setCode(sub ? sub.code : '');
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
    setSubmitting(true);

    try {
      if (currentSubject) {
        await subjectService.update(currentSubject.id, { name, code });
        toast.success(`Subject "${name}" updated successfully!`);
      } else {
        await subjectService.create({ name, code });
        toast.success(`Subject "${name}" created successfully!`);
      }
      fetchSubjects();
      handleCloseModal();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.response?.data?.errors?.code?.[0] || err.response?.data?.errors?.name?.[0] || 'Failed to save subject.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, subjectName) => {
    if (!window.confirm(`Are you sure you want to delete "${subjectName}"? All associated grades will be permanently deleted.`)) return;
    setDeletingId(id);

    try {
      await subjectService.delete(id);
      toast.success(`Subject "${subjectName}" deleted.`);
      fetchSubjects();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to delete subject.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1000px', margin: '0 auto' }} className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '40px' }}>
        
        {/* Navigation Header */}
        <div style={{ marginBottom: '30px', borderBottom: '1px solid var(--border-dark)', paddingBottom: '20px' }}>
          <Link to="/dashboard" className="back-link">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(250, 84, 180, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={22} color="#ff7be1" />
              </div>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: '700' }}>Manage Subjects</h1>
                <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '14px', marginTop: '2px' }}>
                  Define curriculum courses, subject codes, and academic categories.
                </p>
              </div>
            </div>
            <button className="btn-primary" onClick={() => handleOpenModal()}>
              <Plus size={18} /> Add New Subject
            </button>
          </div>
        </div>

        {loading ? (
          <div className="page-loading">
            <span className="spinner"></span>
            <p>Loading subjects...</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-dark)' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Subject Code</th>
                  <th>Subject Name</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subjects.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="empty-state">
                      <BookOpen size={40} style={{ opacity: 0.3, marginBottom: '8px' }} />
                      <p>No subjects added yet. Click "Add New Subject" to register one.</p>
                    </td>
                  </tr>
                ) : (
                  subjects.map((sub) => (
                    <tr key={sub.id}>
                      <td style={{ fontWeight: '700', color: 'hsl(var(--accent))' }}>{sub.code}</td>
                      <td style={{ fontWeight: '600' }}>{sub.name}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button onClick={() => handleOpenModal(sub)} className="btn-edit">
                            <Pencil size={14} /> Edit
                          </button>
                          <button onClick={() => handleDelete(sub.id, sub.name)} className="btn-delete" disabled={deletingId === sub.id}>
                            {deletingId === sub.id ? <span className="spinner spinner-sm"></span> : <Trash2 size={14} />} Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content animate-slide-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700' }}>
                {currentSubject ? 'Edit Subject' : 'Create New Subject'}
              </h2>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', color: 'hsl(var(--text-secondary))', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">Subject Code</label>
                <input
                  type="text"
                  className="glass-input"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. MATH101, ENG202, PHY101"
                  required
                />
              </div>

              <div>
                <label className="form-label">Subject Name</label>
                <input
                  type="text"
                  className="glass-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mathematics, English Language, Physics"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? (
                    <><span className="spinner spinner-sm"></span> Saving...</>
                  ) : (
                    <><Save size={16} /> Save Subject</>
                  )}
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
