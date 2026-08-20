import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Plus, Pencil, Trash2, Layers, Save, X } from 'lucide-react';
import classService from '../../services/classService';

const Classes = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentClass, setCurrentClass] = useState(null);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const data = await classService.getAll();
      setClasses(data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load classes.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (cls = null) => {
    setCurrentClass(cls);
    setName(cls ? cls.name : '');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentClass(null);
    setName('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (currentClass) {
        await classService.update(currentClass.id, { name });
        toast.success(`Class "${name}" updated successfully!`);
      } else {
        await classService.create({ name });
        toast.success(`Class "${name}" created successfully!`);
      }
      fetchClasses();
      handleCloseModal();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.response?.data?.errors?.name?.[0] || 'Failed to save class.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, className) => {
    if (!window.confirm(`Are you sure you want to delete "${className}"?`)) return;
    setDeletingId(id);

    try {
      await classService.delete(id);
      toast.success(`Class "${className}" deleted.`);
      fetchClasses();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to delete class. Make sure it has no registered students.';
      toast.error(msg);
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
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(0, 242, 254, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Layers size={22} color="#00f2fe" />
              </div>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: '700' }}>Manage Classes</h1>
                <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '14px', marginTop: '2px' }}>
                  Define school levels, grade structures, and class rosters.
                </p>
              </div>
            </div>
            <button className="btn-primary" onClick={() => handleOpenModal()}>
              <Plus size={18} /> Add New Class
            </button>
          </div>
        </div>

        {loading ? (
          <div className="page-loading">
            <span className="spinner"></span>
            <p>Loading classes...</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-dark)' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Class Name</th>
                  <th>Student Count</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {classes.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="empty-state">
                      <Layers size={40} style={{ opacity: 0.3, marginBottom: '8px' }} />
                      <p>No classes registered yet. Click "Add New Class" to create one.</p>
                    </td>
                  </tr>
                ) : (
                  classes.map((cls) => (
                    <tr key={cls.id}>
                      <td style={{ color: 'hsl(var(--text-secondary))' }}>#{cls.id}</td>
                      <td style={{ fontWeight: '700' }}>{cls.name}</td>
                      <td>
                        <span className="badge badge-admin">
                          {cls.students_count || 0} Students
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button onClick={() => handleOpenModal(cls)} className="btn-edit">
                            <Pencil size={14} /> Edit
                          </button>
                          <button onClick={() => handleDelete(cls.id, cls.name)} className="btn-delete" disabled={deletingId === cls.id}>
                            {deletingId === cls.id ? <span className="spinner spinner-sm"></span> : <Trash2 size={14} />} Delete
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

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content animate-slide-up">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700' }}>
                {currentClass ? 'Edit Class' : 'Create New Class'}
              </h2>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', color: 'hsl(var(--text-secondary))', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">Class Name</label>
                <input
                  type="text"
                  className="glass-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. JSS 1, SSS 2 Science, Grade 10-A"
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
                    <><Save size={16} /> Save Class</>
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

export default Classes;
