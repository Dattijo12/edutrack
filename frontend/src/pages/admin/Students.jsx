import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import studentService from '../../services/studentService';
import classService from '../../services/classService';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null); // For editing
  
  const [name, setName] = useState('');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [classId, setClassId] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      setError('Failed to load students or classes data.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (student = null) => {
    setCurrentStudent(student);
    setName(student ? student.name : '');
    setAdmissionNumber(student ? student.admission_number : '');
    setClassId(student ? student.class_id : '');
    setError('');
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
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        name,
        admission_number: admissionNumber,
        class_id: parseInt(classId, 10)
      };

      if (currentStudent) {
        // Edit Student
        await studentService.update(currentStudent.id, payload);
      } else {
        // Add Student
        await studentService.create(payload);
      }
      
      // Refresh list
      const updatedStudents = await studentService.getAll();
      setStudents(updatedStudents);
      handleCloseModal();
    } catch (err) {
      setError(
        err.response?.data?.message || 
        err.response?.data?.errors?.admission_number?.[0] || 
        err.response?.data?.errors?.class_id?.[0] || 
        'Failed to save student.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this student? All associated results will be deleted.')) return;
    setError('');

    try {
      await studentService.delete(id);
      const updatedStudents = await studentService.getAll();
      setStudents(updatedStudents);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete student.');
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
          <h1 style={{ fontSize: '28px', fontWeight: '700', marginTop: '10px' }}>Manage Students</h1>
        </div>
        <button className="btn-primary" onClick={() => handleOpenModal()}>
          + Register New Student
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
          Loading students...
        </div>
      ) : (
        <div className="glass-panel" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(255, 255, 255, 0.02)' }}>
                <th style={{ padding: '16px 24px', color: 'hsl(var(--text-secondary))', fontSize: '13px', fontWeight: '600' }}>Admission No.</th>
                <th style={{ padding: '16px 24px', color: 'hsl(var(--text-secondary))', fontSize: '13px', fontWeight: '600' }}>Student Name</th>
                <th style={{ padding: '16px 24px', color: 'hsl(var(--text-secondary))', fontSize: '13px', fontWeight: '600' }}>Assigned Class</th>
                <th style={{ padding: '16px 24px', color: 'hsl(var(--text-secondary))', fontSize: '13px', fontWeight: '600', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan="4" style={{ padding: '30px', textAlign: 'center', color: 'hsl(var(--text-secondary))' }}>
                    No students found. Register one to get started!
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)', transition: 'background 0.2s' }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '700', color: 'hsl(var(--accent))' }}>{student.admission_number}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', fontWeight: '600' }}>{student.name}</td>
                    <td style={{ padding: '16px 24px', fontSize: '14px' }}>
                      <span style={{
                        padding: '3px 8px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        fontSize: '12px'
                      }}>
                        {student.class?.name || 'Unassigned'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                      <button 
                        onClick={() => handleOpenModal(student)}
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
                        onClick={() => handleDelete(student.id)}
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
              {currentStudent ? 'Edit Student Profile' : 'Register Student'}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'hsl(var(--text-secondary))', marginBottom: '6px' }}>
                  Student Name
                </label>
                <input
                  type="text"
                  className="glass-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'hsl(var(--text-secondary))', marginBottom: '6px' }}>
                  Admission Number
                </label>
                <input
                  type="text"
                  className="glass-input"
                  value={admissionNumber}
                  onChange={(e) => setAdmissionNumber(e.target.value)}
                  placeholder="e.g. STU001"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', color: 'hsl(var(--text-secondary))', marginBottom: '6px' }}>
                  Assign Class
                </label>
                <select
                  className="glass-input"
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  required
                  style={{
                    appearance: 'none',
                    color: classId ? 'white' : '#666',
                    cursor: 'pointer'
                  }}
                >
                  <option value="" disabled style={{ background: '#121826', color: '#666' }}>Select Class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id} style={{ background: '#121826', color: 'white' }}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" className="btn-logout" onClick={handleCloseModal} style={{ border: 'none', background: 'rgba(255,255,255,0.06)', color: 'white' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? 'Registering...' : 'Save Student'}
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
