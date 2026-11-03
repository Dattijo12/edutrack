import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  ArrowRightLeft, Users, ChevronDown, CheckCircle2,
  RotateCcw, GraduationCap, RefreshCw, Send, ArrowRight,
  Repeat, Award
} from 'lucide-react';
import classService from '../../services/classService';
import studentService from '../../services/studentService';
import resultWindowService from '../../services/resultWindowService';
import adminService from '../../services/adminService';

/**
 * StudentPromotion — full-featured promotion management UI.
 * Enables the Super Admin to select a source class, view enrolled students,
 * set per-student promotion status, and submit the promotion batch.
 */
const StudentPromotion = () => {
  // Dropdown data sources
  const [classes, setClasses] = useState([]);
  const [resultWindows, setResultWindows] = useState([]);

  // Header selectors
  const [fromClassId, setFromClassId] = useState('');
  const [toClassId, setToClassId] = useState('');
  const [resultWindowId, setResultWindowId] = useState('');

  // Student roster + per-student status
  const [students, setStudents] = useState([]);
  const [statusMap, setStatusMap] = useState({}); // { [student_id]: 'promoted' | 'repeated' | 'graduated' }

  // Loading flags
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Load classes and result windows on mount
  useEffect(() => {
    const loadData = async () => {
      setLoadingClasses(true);
      try {
        const [classData, windowData] = await Promise.all([
          classService.getAll(),
          resultWindowService.getAll(),
        ]);
        setClasses(Array.isArray(classData) ? classData : []);
        setResultWindows(Array.isArray(windowData) ? windowData : []);
      } catch (err) {
        console.error('Failed to load initial data:', err);
        toast.error('Failed to load classes or result windows.');
      } finally {
        setLoadingClasses(false);
      }
    };
    loadData();
  }, []);

  // Fetch students when source class changes
  const fetchStudents = useCallback(async (classId) => {
    if (!classId) {
      setStudents([]);
      setStatusMap({});
      return;
    }
    setLoadingStudents(true);
    try {
      const data = await studentService.getAll('', classId);
      const list = Array.isArray(data) ? data : [];
      setStudents(list);
      // Default every student to 'promoted'
      const defaults = {};
      list.forEach(s => { defaults[s.id] = 'promoted'; });
      setStatusMap(defaults);
    } catch (err) {
      console.error('Failed to load students:', err);
      toast.error('Failed to load student roster.');
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents(fromClassId);
  }, [fromClassId, fetchStudents]);

  // Per-student status change
  const handleStatusChange = (studentId, status) => {
    setStatusMap(prev => ({ ...prev, [studentId]: status }));
  };

  // Bulk action helpers
  const markAll = (status) => {
    const updated = {};
    students.forEach(s => { updated[s.id] = status; });
    setStatusMap(updated);
    toast.info(`All students marked as "${status}".`);
  };

  const resetAll = () => {
    const defaults = {};
    students.forEach(s => { defaults[s.id] = 'promoted'; });
    setStatusMap(defaults);
    toast.info('All statuses reset to "promoted".');
  };

  // Submit the promotion batch
  const handleSubmit = async () => {
    // Validation
    if (!fromClassId) return toast.warning('Please select a source class.');
    if (!toClassId) return toast.warning('Please select a destination class.');
    if (!resultWindowId) return toast.warning('Please select a result window / academic session.');
    if (students.length === 0) return toast.warning('No students found in the selected class.');

    const payload = {
      from_class_id: parseInt(fromClassId),
      to_class_id: parseInt(toClassId),
      result_window_id: parseInt(resultWindowId),
      students: students.map(s => ({
        student_id: s.id,
        status: statusMap[s.id] || 'promoted',
      })),
    };

    setSubmitting(true);
    try {
      const res = await adminService.promoteStudents(payload);
      toast.success(res.message || 'Promotion completed successfully!');

      // Show summary breakdown
      if (res.summary) {
        const { promoted, repeated, graduated } = res.summary;
        toast.info(`Summary → Promoted: ${promoted}, Repeated: ${repeated}, Graduated: ${graduated}`);
      }

      // Reset the form
      setFromClassId('');
      setToClassId('');
      setStudents([]);
      setStatusMap({});
    } catch (err) {
      console.error('Promotion failed:', err);
      const msg = err.response?.data?.message || 'Promotion failed. Please try again.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Counters for the summary bar
  const promotedCount = Object.values(statusMap).filter(s => s === 'promoted').length;
  const repeatedCount = Object.values(statusMap).filter(s => s === 'repeated').length;
  const graduatedCount = Object.values(statusMap).filter(s => s === 'graduated').length;

  // Helper to get the class display name
  const getClassName = (id) => {
    const cls = classes.find(c => c.id === parseInt(id));
    return cls ? `${cls.name} ${cls.arm || ''}`.trim() : '—';
  };

  // Status badge styling
  const getStatusStyle = (status) => {
    switch (status) {
      case 'promoted':
        return { bg: 'rgba(0, 230, 118, 0.12)', color: '#00e676', border: 'rgba(0, 230, 118, 0.25)' };
      case 'repeated':
        return { bg: 'rgba(255, 180, 0, 0.12)', color: '#ffb400', border: 'rgba(255, 180, 0, 0.25)' };
      case 'graduated':
        return { bg: 'rgba(92, 124, 250, 0.12)', color: '#7b93ff', border: 'rgba(92, 124, 250, 0.25)' };
      default:
        return { bg: 'rgba(148, 163, 184, 0.12)', color: '#94a3b8', border: 'rgba(148, 163, 184, 0.25)' };
    }
  };

  if (loadingClasses) {
    return (
      <div className="page-loading" style={{ padding: '80px 0' }}>
        <span className="spinner"></span>
        <p>Loading promotion data...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }} className="animate-fade-in">

      {/* Page Header */}
      <div className="glass-panel" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px hsla(var(--primary), 0.3)'
          }}>
            <ArrowRightLeft size={22} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '800' }}>Student Promotion & Transition</h1>
            <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))' }}>
              Promote, repeat, or graduate students with full audit trail tracking
            </p>
          </div>
        </div>
      </div>

      {/* Selector Bar */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'flex-end' }}>

          {/* Source Class */}
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: 'hsl(var(--text-secondary))', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Source Class
            </label>
            <select
              value={fromClassId}
              onChange={(e) => setFromClassId(e.target.value)}
              className="form-input"
              style={{ height: '42px', fontSize: '13px' }}
            >
              <option value="">— Select source class —</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.arm || ''}</option>
              ))}
            </select>
          </div>

          {/* Arrow indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: '4px' }}>
            <ArrowRight size={20} color="hsl(var(--text-secondary))" />
          </div>

          {/* Destination Class */}
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: 'hsl(var(--text-secondary))', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Destination Class
            </label>
            <select
              value={toClassId}
              onChange={(e) => setToClassId(e.target.value)}
              className="form-input"
              style={{ height: '42px', fontSize: '13px' }}
            >
              <option value="">— Select destination class —</option>
              {classes.filter(c => String(c.id) !== String(fromClassId)).map(c => (
                <option key={c.id} value={c.id}>{c.name} {c.arm || ''}</option>
              ))}
            </select>
          </div>

          {/* Result Window */}
          <div style={{ flex: '1 1 240px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', color: 'hsl(var(--text-secondary))', marginBottom: '6px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Academic Session / Term
            </label>
            <select
              value={resultWindowId}
              onChange={(e) => setResultWindowId(e.target.value)}
              className="form-input"
              style={{ height: '42px', fontSize: '13px' }}
            >
              <option value="">— Select session/term —</option>
              {resultWindows.map(w => (
                <option key={w.id} value={w.id}>
                  {w.academic_session} — {w.term}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Roster + Bulk Actions */}
      {fromClassId && (
        <>
          {/* Summary Bar + Bulk Controls */}
          <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', justifyContent: 'space-between' }}>

              {/* Live Counters */}
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={14} color="hsl(var(--text-secondary))" />
                  <span style={{ fontSize: '13px', fontWeight: '600' }}>{students.length} student{students.length !== 1 ? 's' : ''}</span>
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px',
                  borderRadius: '6px', fontSize: '11px', fontWeight: '700',
                  background: 'rgba(0, 230, 118, 0.12)', color: '#00e676', border: '1px solid rgba(0, 230, 118, 0.25)'
                }}>
                  <CheckCircle2 size={12} /> {promotedCount} Promoted
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px',
                  borderRadius: '6px', fontSize: '11px', fontWeight: '700',
                  background: 'rgba(255, 180, 0, 0.12)', color: '#ffb400', border: '1px solid rgba(255, 180, 0, 0.25)'
                }}>
                  <Repeat size={12} /> {repeatedCount} Repeated
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px',
                  borderRadius: '6px', fontSize: '11px', fontWeight: '700',
                  background: 'rgba(92, 124, 250, 0.12)', color: '#7b93ff', border: '1px solid rgba(92, 124, 250, 0.25)'
                }}>
                  <Award size={12} /> {graduatedCount} Graduated
                </div>
              </div>

              {/* Bulk Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => markAll('promoted')}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
                    background: 'rgba(0, 230, 118, 0.1)', color: '#00e676',
                    border: '1px solid rgba(0, 230, 118, 0.2)', cursor: 'pointer',
                  }}
                >
                  <CheckCircle2 size={13} /> All Promoted
                </button>
                <button
                  onClick={() => markAll('repeated')}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
                    background: 'rgba(255, 180, 0, 0.1)', color: '#ffb400',
                    border: '1px solid rgba(255, 180, 0, 0.2)', cursor: 'pointer',
                  }}
                >
                  <Repeat size={13} /> All Repeated
                </button>
                <button
                  onClick={() => markAll('graduated')}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
                    background: 'rgba(92, 124, 250, 0.1)', color: '#7b93ff',
                    border: '1px solid rgba(92, 124, 250, 0.2)', cursor: 'pointer',
                  }}
                >
                  <GraduationCap size={13} /> All Graduated
                </button>
                <button
                  onClick={resetAll}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '5px',
                    padding: '6px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: '600',
                    background: 'rgba(148, 163, 184, 0.08)', color: 'hsl(var(--text-secondary))',
                    border: '1px solid var(--border-dark)', cursor: 'pointer',
                  }}
                >
                  <RotateCcw size={13} /> Reset
                </button>
              </div>
            </div>
          </div>

          {/* Student Roster Table */}
          <div className="glass-panel" style={{ overflow: 'hidden', marginBottom: '24px' }}>
            {loadingStudents ? (
              <div className="page-loading" style={{ padding: '60px 0' }}>
                <span className="spinner"></span>
                <p>Loading student roster...</p>
              </div>
            ) : students.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                <Users size={48} color="hsl(var(--text-secondary))" style={{ marginBottom: '12px', opacity: 0.4 }} />
                <p style={{ fontSize: '15px', fontWeight: '600', color: 'hsl(var(--text-secondary))' }}>
                  No students found in {getClassName(fromClassId)}
                </p>
                <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', opacity: 0.7, marginTop: '4px' }}>
                  Please enroll students before running promotions.
                </p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '50px' }}>#</th>
                      <th>Student Name</th>
                      <th>Admission Number</th>
                      <th>Current Class</th>
                      <th style={{ width: '200px' }}>Promotion Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, idx) => {
                      const status = statusMap[student.id] || 'promoted';
                      const style = getStatusStyle(status);
                      const fullName = student.name
                        || `${student.first_name || ''} ${student.last_name || ''}`.trim()
                        || '—';

                      return (
                        <tr key={student.id}>
                          <td style={{ fontSize: '12px', color: 'hsl(var(--text-secondary))' }}>{idx + 1}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{
                                width: '30px', height: '30px', borderRadius: '8px',
                                background: style.bg,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '11px', fontWeight: '800', color: style.color,
                                border: `1px solid ${style.border}`,
                              }}>
                                {fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                              </div>
                              <span style={{ fontSize: '13px', fontWeight: '600' }}>{fullName}</span>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontSize: '12px', fontFamily: 'monospace', color: 'hsl(var(--text-secondary))' }}>
                              {student.admission_number || '—'}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '12px' }}>
                              {student.class?.name ? `${student.class.name} ${student.class.arm || ''}`.trim() : getClassName(fromClassId)}
                            </span>
                          </td>
                          <td>
                            <select
                              value={status}
                              onChange={(e) => handleStatusChange(student.id, e.target.value)}
                              className="form-input"
                              style={{
                                height: '34px', fontSize: '12px', fontWeight: '600',
                                background: style.bg,
                                color: style.color,
                                border: `1px solid ${style.border}`,
                              }}
                            >
                              <option value="promoted">✅ Promoted</option>
                              <option value="repeated">🔁 Repeated</option>
                              <option value="graduated">🎓 Graduated</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Submit Button */}
          {students.length > 0 && (
            <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'hsl(var(--text-secondary))' }}>
                {students.length} student{students.length !== 1 ? 's' : ''} will be processed
              </span>
              <button
                onClick={handleSubmit}
                disabled={submitting || !toClassId || !resultWindowId}
                className="btn-primary"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '12px 28px', fontSize: '14px', fontWeight: '700',
                  opacity: (submitting || !toClassId || !resultWindowId) ? 0.5 : 1,
                }}
              >
                {submitting ? (
                  <><span className="spinner spinner-sm"></span> Processing...</>
                ) : (
                  <><Send size={16} /> Execute Promotion</>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default StudentPromotion;
