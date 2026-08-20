import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, UserPlus, Pencil, Trash2, GraduationCap, Save, X } from 'lucide-react';
import studentService from '../../services/studentService';
import classService from '../../services/classService';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  
  const [name, setName] = useState('');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [classId, setClassId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const studentData = await studentService.getAll();
      const classData = await classService.getAll();
      setStudents(studentData);
      setClasses(classData);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load students or classes data.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (student = null) => {
    setCurrentStudent(student);
    setName(student ? student.name : '');
    setAdmissionNumber(student ? student.admission_number : '');
    setClassId(student ? student.class_id : '');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentStudent(null);
    setName('');
    setAdmissionNumber('');
    setClassId('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        name,
        admission_number: admissionNumber,
        class_id: parseInt(classId, 10)
      };

      if (currentStudent) {
        await studentService.update(currentStudent.id, payload);
        toast.success(`Student profile for "${name}" updated!`);
      } else {
        await studentService.create(payload);
        toast.success(`Student "${name}" registered successfully!`);
      }
      
      const updatedStudents = await studentService.getAll();
      setStudents(updatedStudents);
      handleCloseModal();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || err.response?.data?.errors?.admission_number?.[0] || err.response?.data?.errors?.class_id?.[0] || 'Failed to save student.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, studentName) => {
    if (!window.confirm(`Are you sure you want to delete student "${studentName}"? All associated grades will be deleted.`)) return;
    setDeletingId(id);

    try {
      await studentService.delete(id);
      toast.success(`Student "${studentName}" deleted.`);
      const updatedStudents = await studentService.getAll();
      setStudents(updatedStudents);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to delete student.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1050px', margin: '0 auto' }} className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '40px' }}>
        
        {/* Navigation Header */}
        <div style={{ marginBottom: '30px', borderBottom: '1px solid var(--border-dark)', paddingBottom: '20px' }}>
          <Link to="/dashboard" className="back-link">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(235, 92, 180, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GraduationCap size={22} color="#ff7be1" />
              </div>
              <div>
                <h1 style={{ fontSize: '28px', fontWeight: '700' }}>Student Directory</h1>
                <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '14px', marginTop: '2px' }}>
                  Register student profiles and manage classroom placements.
                </p>
              </div>
            </div>
            <button className="btn-primary" onClick={() => handleOpenModal()}>
              <UserPlus size={18} /> Register New Student
            </button>
          </div>
        </div>

        {loading ? (
          <div className="page-loading">
            <span className="spinner"></span>
            <p>Loading student directory...</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-dark)' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Admission No.</th>
                  <th>Student Name</th>
                  <th>Assigned Class</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="empty-state">
                      <GraduationCap size={40} style={{ opacity: 0.3, marginBottom: '8px' }} />
                      <p>No students enrolled yet. Click "Register New Student" to get started.</p>
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id}>
                      <td style={{ fontWeight: '700', color: 'hsl(var(--accent))' }}>{student.admission_number}</td>
                      <td style={{ fontWeight: '600' }}>{student.name}</td>
                      <td>
                        <span className="badge badge-teacher">
                          {student.class?.name || 'Unassigned'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button onClick={() => handleOpenModal(student)} className="btn-edit">
                            <Pencil size={14} /> Edit
                          </button>
                          <button onClick={() => handleDelete(student.id, student.name)} className="btn-delete" disabled={deletingId === student.id}>
                            {deletingId === student.id ? <span className="spinner spinner-sm"></span> : <Trash2 size={14} />} Delete
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
                {currentStudent ? 'Edit Student Profile' : 'Register New Student'}
              </h2>
              <button onClick={handleCloseModal} style={{ background: 'none', border: 'none', color: 'hsl(var(--text-secondary))', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">Student Full Name</label>
                <input
                  type="text"
                  className="glass-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe, Fatima Musa"
                  required
                />
              </div>

              <div>
                <label className="form-label">Admission Number</label>
                <input
                  type="text"
                  className="glass-input"
                  value={admissionNumber}
                  onChange={(e) => setAdmissionNumber(e.target.value)}
                  placeholder="e.g. STU/2024/001"
                  required
                />
              </div>

              <div>
                <label className="form-label">Assign Class</label>
                <select
                  className="glass-input"
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  required
                >
                  <option value="" disabled style={{ color: '#888' }}>Select Class Placement</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id} style={{ color: '#000' }}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? (
                    <><span className="spinner spinner-sm"></span> Saving...</>
                  ) : (
                    <><Save size={16} /> Save Student</>
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

export default Students;
