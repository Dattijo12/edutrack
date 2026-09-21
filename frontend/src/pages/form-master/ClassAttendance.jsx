import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Layers, Calendar, Save, Check, X, Clock, HelpCircle, FileText } from 'lucide-react';
import formMasterService from '../../services/formMasterService';
import studentService from '../../services/studentService';

/**
 * Form Master Class Attendance Tracking View
 * Allows form masters to mark and save daily attendance registers with statuses:
 * Present, Late, Excused, and Absent, including optional remarks for absence/excuse.
 */
const ClassAttendance = () => {
  const [assignedClass, setAssignedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [remarks, setRemarks] = useState({});
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchClassData();
  }, []);

  useEffect(() => {
    if (assignedClass && assignedClass.id && date) {
      fetchExistingAttendance(assignedClass.id, date);
    }
  }, [date, assignedClass]);

  /**
   * Fetch assigned class details and student roster
   */
  const fetchClassData = async () => {
    setLoading(true);
    try {
      // Fetch assigned class details from authenticated Form Master user session
      const classData = await formMasterService.getAssignedClass();
      setAssignedClass(classData);

      let list = [];
      if (classData && classData.id) {
        try {
          const res = await studentService.getByClass(classData.id);
          const fetchedArray = Array.isArray(res) ? res : (res?.data || []);
          list = fetchedArray.length > 0 ? fetchedArray : (classData.students || []);
        } catch (fetchErr) {
          console.warn('Student list fetch fallback for attendance:', fetchErr);
          list = classData.students || [];
        }
      } else if (classData && classData.students) {
        list = classData.students;
      }

      setStudents(list);

      // Initialize default attendance register state to 'present' for all class students
      const initialAttendance = {};
      const initialRemarks = {};
      list.forEach(s => {
        initialAttendance[s.id] = 'present';
        initialRemarks[s.id] = '';
      });
      setAttendance(initialAttendance);
      setRemarks(initialRemarks);

      if (classData && classData.id) {
        await fetchExistingAttendance(classData.id, date);
      }
    } catch (err) {
      console.error('Attendance error:', err);
      toast.error('Failed to load class attendance register.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch existing daily attendance records for the given date and class
   */
  const fetchExistingAttendance = async (classId, targetDate) => {
    try {
      const res = await formMasterService.getAttendance(classId, targetDate);
      if (res && res.attendance && Array.isArray(res.attendance) && res.attendance.length > 0) {
        const fetchedAttendance = {};
        const fetchedRemarks = {};
        res.attendance.forEach(record => {
          fetchedAttendance[record.student_id] = record.status;
          fetchedRemarks[record.student_id] = record.remark || '';
        });
        setAttendance(prev => ({ ...prev, ...fetchedAttendance }));
        setRemarks(prev => ({ ...prev, ...fetchedRemarks }));
      }
    } catch (err) {
      console.info('No existing attendance recorded for date:', targetDate);
    }
  };

  /**
   * Update individual student attendance status
   */
  const handleStatusChange = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
    // Clear remark if status is changed to Present or Late
    if (status === 'present' || status === 'late') {
      setRemarks(prev => ({ ...prev, [studentId]: '' }));
    }
  };

  /**
   * Update individual student remark text
   */
  const handleRemarkChange = (studentId, text) => {
    setRemarks(prev => ({ ...prev, [studentId]: text }));
  };

  /**
   * Submit and persist daily attendance register to backend database
   */
  const handleSave = async (e) => {
    e.preventDefault();
    if (!assignedClass || !assignedClass.id) {
      toast.error('No valid class assigned to mark attendance for.');
      return;
    }

    setSubmitting(true);
    try {
      const records = students.map(s => ({
        student_id: s.id,
        status: attendance[s.id] || 'present',
        remark: ['excused', 'absent'].includes(attendance[s.id]) ? (remarks[s.id] || '') : null
      }));

      const payload = {
        class_id: assignedClass.id,
        date: date,
        records: records
      };

      await formMasterService.saveAttendance(payload);
      toast.success(`Attendance register for ${date} saved successfully!`);
    } catch (err) {
      console.error('Failed to save attendance:', err);
      toast.error(err.response?.data?.message || 'Failed to save attendance register.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1050px', margin: '0 auto' }} className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '32px' }}>

        {/* Header Section */}
        <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-dark)', paddingBottom: '16px' }}>
          <Link to="/dashboard" className="back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--text-secondary))', textDecoration: 'none', marginBottom: '12px' }}>
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(255, 123, 225, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Layers size={22} color="#ff7be1" />
              </div>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: '800' }}>
                  Class Attendance Tracking {assignedClass ? `— ${assignedClass.name} ${assignedClass.arm}` : ''}
                </h2>
                <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '14px' }}>
                  Mark daily attendance registers for students in your assigned class.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calendar size={18} color="#ff7be1" />
              <input
                type="date"
                className="glass-input"
                style={{ height: '40px', fontSize: '13px' }}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="page-loading">
            <span className="spinner"></span>
            <p>Loading attendance register...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px', textAlign: 'center' }}>
            <Layers size={48} color="#ff7be1" style={{ opacity: 0.5, marginBottom: '12px' }} />
            <p style={{ fontSize: '16px', fontWeight: '600' }}>No Students Enrolled</p>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '13px' }}>
              No active students found in your assigned form class.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSave}>
            <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-dark)', marginBottom: '24px' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '15%' }}>Adm #</th>
                    <th style={{ width: '25%' }}>Student Name</th>
                    <th style={{ textAlign: 'center', width: '60%' }}>Attendance Status & Remark ({date})</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => {
                    const currentStatus = attendance[s.id] || 'present';
                    const currentRemark = remarks[s.id] || '';
                    const showRemarkField = currentStatus === 'excused' || currentStatus === 'absent';

                    return (
                      <tr key={s.id}>
                        <td style={{ fontWeight: '700', color: '#7b93ff' }}>{s.admission_number}</td>
                        <td style={{ fontWeight: '600' }}>{s.first_name ? `${s.first_name} ${s.last_name}` : s.name}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                            {/* 4 Status Option Buttons */}
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                              <button
                                type="button"
                                onClick={() => handleStatusChange(s.id, 'present')}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  border: 'none',
                                  fontWeight: '700',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  background: currentStatus === 'present' ? '#00e676' : 'rgba(255,255,255,0.05)',
                                  color: currentStatus === 'present' ? '#000' : 'hsl(var(--text-secondary))',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <Check size={14} /> Present
                              </button>

                              <button
                                type="button"
                                onClick={() => handleStatusChange(s.id, 'late')}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  border: 'none',
                                  fontWeight: '700',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  background: currentStatus === 'late' ? '#ffb400' : 'rgba(255,255,255,0.05)',
                                  color: currentStatus === 'late' ? '#000' : 'hsl(var(--text-secondary))',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <Clock size={14} /> Late
                              </button>

                              <button
                                type="button"
                                onClick={() => handleStatusChange(s.id, 'excused')}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  border: 'none',
                                  fontWeight: '700',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  background: currentStatus === 'excused' ? '#3b82f6' : 'rgba(255,255,255,0.05)',
                                  color: currentStatus === 'excused' ? '#fff' : 'hsl(var(--text-secondary))',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <HelpCircle size={14} /> Excused
                              </button>

                              <button
                                type="button"
                                onClick={() => handleStatusChange(s.id, 'absent')}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: '8px',
                                  border: 'none',
                                  fontWeight: '700',
                                  fontSize: '12px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  background: currentStatus === 'absent' ? '#ff4b4b' : 'rgba(255,255,255,0.05)',
                                  color: currentStatus === 'absent' ? '#fff' : 'hsl(var(--text-secondary))',
                                  transition: 'all 0.15s ease',
                                }}
                              >
                                <X size={14} /> Absent
                              </button>
                            </div>

                            {/* Conditional Reason / Remark Input Field */}
                            {showRemarkField && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', width: '100%', maxWidth: '380px', marginTop: '4px' }}>
                                <FileText size={14} color="hsl(var(--text-secondary))" />
                                <input
                                  type="text"
                                  placeholder={currentStatus === 'excused' ? 'Reason for excuse (e.g. Sick Leave, Medical Appointment)' : 'Reason for absence (e.g. Unexcused, Travel)'}
                                  className="glass-input"
                                  style={{ height: '32px', fontSize: '12px', width: '100%' }}
                                  value={currentRemark}
                                  onChange={(e) => handleRemarkChange(s.id, e.target.value)}
                                />
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn-primary" disabled={submitting} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                {submitting ? <span className="spinner spinner-sm"></span> : <Save size={16} />}
                {submitting ? 'Saving Register...' : 'Save Attendance Register'}
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default ClassAttendance;
