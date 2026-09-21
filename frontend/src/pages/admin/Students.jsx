import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, UserPlus, Pencil, Trash2, GraduationCap, Save, X, Search, Filter } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import studentService from '../../services/studentService';
import classService from '../../services/classService';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);

  // Search and Filter States
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  
  const [name, setName] = useState('');
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [classId, setClassId] = useState('');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [studentToDelete, setStudentToDelete] = useState(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch students on search or filter change
  useEffect(() => {
    fetchStudents(debouncedSearch, classFilter);
  }, [debouncedSearch, classFilter]);

  const fetchClasses = async () => {
    try {
      const classData = await classService.getAll();
      setClasses(classData);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load classes.');
    }
  };

  const fetchStudents = async (searchQuery = '', filterClass = '') => {
    setLoading(true);
    try {
      const studentData = await studentService.getAll(searchQuery, filterClass);
      setStudents(studentData);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load students data.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (student = null) => {
    setCurrentStudent(student);
    setName(student ? student.name : '');
    setAdmissionNumber(student ? student.admission_number : '');
    setClassId(student ? student.class_id : '');
    setGender(student ? student.gender || '' : '');
    setDob(student ? student.dob || '' : '');
    setParentPhone(student ? student.parent_phone || '' : '');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setCurrentStudent(null);
    setName('');
    setAdmissionNumber('');
    setClassId('');
    setGender('');
    setDob('');
    setParentPhone('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!/^\d{11}$/.test(parentPhone)) {
      toast.error('Guardian phone number must be exactly 11 numeric digits.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name,
        admission_number: admissionNumber,
        class_id: parseInt(classId, 10),
        gender,
        dob,
        parent_phone: parentPhone
      };

      if (currentStudent) {
        await studentService.update(currentStudent.id, payload);
        toast.success(`Student profile for "${name}" updated!`);
      } else {
        await studentService.create(payload);
        toast.success(`Student "${name}" registered successfully!`);
      }
      
      fetchStudents(debouncedSearch, classFilter);
      handleCloseModal();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message 
        || err.response?.data?.errors?.parent_phone?.[0]
        || err.response?.data?.errors?.admission_number?.[0] 
        || err.response?.data?.errors?.class_id?.[0] 
        || 'Failed to save student.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = (student) => {
    setStudentToDelete(student);
  };

  const executeDelete = async () => {
    if (!studentToDelete) return;
    const { id, name: studentName } = studentToDelete;
    
    setDeletingId(id);
    setStudentToDelete(null);

    try {
      await studentService.delete(id);
      toast.success(`Student "${studentName}" deleted.`);
      fetchStudents(debouncedSearch, classFilter);
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
        <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-dark)', paddingBottom: '20px' }}>
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

        {/* Toolbar: Global Search & Class Filter */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '380px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-secondary))' }} />
            <input 
              type="text" 
              placeholder="Search by student name or admission no..." 
              className="glass-input" 
              style={{ paddingLeft: '38px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ position: 'relative', minWidth: '220px' }}>
            <Filter size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-secondary))' }} />
            <select 
              className="glass-input" 
              style={{ paddingLeft: '38px' }}
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
            >
              <option value="" style={{ color: '#000' }}>All Classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id} style={{ color: '#000' }}>
                  {cls.name} (Arm {cls.arm})
                </option>
              ))}
            </select>
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
                  <th>Gender</th>
                  <th>Assigned Class</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-state">
                      <GraduationCap size={40} style={{ opacity: 0.3, marginBottom: '8px' }} />
                      <p>No students found matching your criteria.</p>
                    </td>
                  </tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id}>
                      <td style={{ fontWeight: '700', color: 'hsl(var(--accent))' }}>{student.admission_number}</td>
                      <td style={{ fontWeight: '600' }}>{student.name}</td>
                      <td>{student.gender || '-'}</td>
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
                          <button onClick={() => handleDeleteConfirm(student)} className="btn-delete" disabled={deletingId === student.id}>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Gender</label>
                  <Select value={gender} onValueChange={(val) => setGender(val)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="form-label">Assign Class</label>
                  <Select value={classId.toString()} onValueChange={(val) => setClassId(val)} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Class Placement" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id.toString()}>
                          {cls.name} (Arm {cls.arm})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Date of Birth</label>
                  <input
                    type="date"
                    className="glass-input"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Guardian Phone Number</label>
                  <input
                    type="text"
                    className="glass-input"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 08012345678"
                    minLength={11}
                    maxLength={11}
                    pattern="[0-9]{11}"
                    required
                  />
                  {parentPhone && parentPhone.length !== 11 && (
                    <span style={{ color: '#ff4b4b', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      Must be exactly 11 numeric digits ({parentPhone.length}/11).
                    </span>
                  )}
                </div>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!studentToDelete} onOpenChange={(open) => !open && setStudentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Student?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{studentToDelete?.name}</strong>? 
              This action cannot be undone and all associated grades and records will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} style={{ background: '#ff4b4b', color: '#fff' }}>
              Delete Student
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default Students;
