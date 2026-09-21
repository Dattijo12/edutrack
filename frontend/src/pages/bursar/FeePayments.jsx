import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, DollarSign, Lock, Unlock, History, CheckCircle2, AlertCircle, X, Search, Filter } from 'lucide-react';
import bursarService from '../../services/bursarService';
import classService from '../../services/classService';

const FeePayments = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Payment Modal State
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [amountDue, setAmountDue] = useState('150000');
  const [amountPaid, setAmountPaid] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  useEffect(() => {
    classService.getAll()
      .then(res => setClasses(Array.isArray(res) ? res : (res?.data || [])))
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [selectedClass, statusFilter, search]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await bursarService.getStudents(selectedClass, statusFilter, search);
      setStudents(Array.isArray(data) ? data : (data?.data || []));
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch fee payment records.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleClearance = async (student) => {
    const newStatus = !student.fee_cleared_status;
    try {
      await bursarService.toggleClearance(student.id, newStatus);
      toast.success(`Fee clearance for ${student.first_name || student.name} updated: ${newStatus ? 'CLEARED 🔓' : 'LOCKED 🔒'}`);
      fetchStudents();
    } catch (err) {
      console.error(err);
      toast.error('Failed to toggle fee clearance status.');
    }
  };

  const handleOpenPayment = (student) => {
    setSelectedStudent(student);
    const existingPayment = student.fee_payments && student.fee_payments[0];
    if (existingPayment) {
      setAmountDue(existingPayment.amount_due ? existingPayment.amount_due.toString() : '150000');
      setAmountPaid(existingPayment.amount_paid ? existingPayment.amount_paid.toString() : '0');
    } else {
      setAmountDue('150000');
      setAmountPaid('0');
    }
    setShowPaymentModal(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setSubmittingPayment(true);

    const dueNum = parseFloat(amountDue) || 0;
    const paidNum = parseFloat(amountPaid) || 0;

    try {
      await bursarService.recordPayment({
        student_id: selectedStudent.id,
        term_id: 1, // Current active term
        amount_due: dueNum,
        amount_paid: paidNum,
      });

      const balance = Math.max(0, dueNum - paidNum);
      const statusText = balance === 0 ? 'CLEARED' : (paidNum > 0 ? 'PARTIAL' : 'UNPAID');

      toast.success(`Payment of ₦${paidNum.toLocaleString()} recorded for ${selectedStudent.first_name || selectedStudent.name}. Status: ${statusText}`);
      setShowPaymentModal(false);
      fetchStudents();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to record payment.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleOpenAudit = (student) => {
    setSelectedStudent(student);
    setShowAuditModal(true);
  };

  const getStatusBadge = (student) => {
    const payment = student.fee_payments && student.fee_payments[0];
    if (!payment) {
      return (
        <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '12px', fontWeight: '800', background: 'rgba(255, 75, 75, 0.15)', color: '#ff4b4b', textTransform: 'uppercase' }}>
          Unpaid (₦0)
        </span>
      );
    }

    const due = parseFloat(payment.amount_due) || 150000;
    const paid = parseFloat(payment.amount_paid) || 0;
    const balance = Math.max(0, due - paid);

    if (balance === 0 && paid > 0) {
      return (
        <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '12px', fontWeight: '800', background: 'rgba(0, 230, 118, 0.15)', color: '#00e676', textTransform: 'uppercase' }}>
          Cleared (Paid ₦{paid.toLocaleString()})
        </span>
      );
    } else if (paid > 0 && balance > 0) {
      return (
        <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '12px', fontWeight: '800', background: 'rgba(255, 180, 0, 0.15)', color: '#ffb400', textTransform: 'uppercase' }}>
          Partial (Paid: ₦{paid.toLocaleString()} | Bal: ₦{balance.toLocaleString()})
        </span>
      );
    } else {
      return (
        <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '12px', fontWeight: '800', background: 'rgba(255, 75, 75, 0.15)', color: '#ff4b4b', textTransform: 'uppercase' }}>
          Unpaid (Bal: ₦{due.toLocaleString()})
        </span>
      );
    }
  };

  const calculatedBalance = Math.max(0, (parseFloat(amountDue) || 0) - (parseFloat(amountPaid) || 0));

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }} className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '36px' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '28px', borderBottom: '1px solid var(--border-dark)', paddingBottom: '20px' }}>
          <Link to="/dashboard" className="back-link">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginTop: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(0, 242, 254, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={22} color="#00f2fe" />
              </div>
              <div>
                <h2 style={{ fontSize: '26px', fontWeight: '800' }}>Hybrid Bursar Fee Collection & Gatekeeper</h2>
                <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '14px', marginTop: '2px' }}>
                  Input student tuition payments, auto-calculate balances, assign Cleared/Partial/Unpaid badges, and enforce report card fee clearance locks.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '340px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-secondary))' }} />
            <input 
              type="text" 
              placeholder="Search student or admission #..." 
              className="glass-input" 
              style={{ paddingLeft: '38px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ position: 'relative', minWidth: '200px' }}>
            <select className="glass-input" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
              <option value="" style={{ color: '#000' }}>All Classes</option>
              {classes.map(c => (
                <option key={c.id} value={c.id} style={{ color: '#000' }}>{c.name} {c.arm}</option>
              ))}
            </select>
          </div>

          <div style={{ position: 'relative', minWidth: '200px' }}>
            <select className="glass-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all" style={{ color: '#000' }}>All Clearance Statuses</option>
              <option value="cleared" style={{ color: '#000' }}>Cleared (Paid)</option>
              <option value="owing" style={{ color: '#000' }}>Owing (Report Card Locked)</option>
            </select>
          </div>
        </div>

        {/* Student Fee Table */}
        {loading ? (
          <div className="page-loading">
            <span className="spinner"></span>
            <p>Loading student fee collection directory...</p>
          </div>
        ) : students.length === 0 ? (
          <div className="empty-state">
            <DollarSign size={44} style={{ opacity: 0.3, marginBottom: '8px' }} />
            <p>No student fee records found matching filter criteria.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-dark)' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Admission #</th>
                  <th>Student Name</th>
                  <th>Class Arm</th>
                  <th>Payment Status</th>
                  <th>Report Card Gatekeeper</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => {
                  const isCleared = s.fee_cleared_status;
                  return (
                    <tr key={s.id}>
                      <td style={{ fontWeight: '700', color: '#7b93ff' }}>{s.admission_number}</td>
                      <td style={{ fontWeight: '700' }}>{s.first_name ? `${s.first_name} ${s.last_name}` : s.name}</td>
                      <td>{s.class ? `${s.class.name} ${s.class.arm || ''}` : 'N/A'}</td>
                      <td>{getStatusBadge(s)}</td>
                      <td>
                        <button 
                          onClick={() => handleToggleClearance(s)} 
                          style={{ 
                            padding: '6px 12px', 
                            borderRadius: '8px', 
                            border: 'none', 
                            cursor: 'pointer', 
                            fontWeight: '700', 
                            fontSize: '12px', 
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: isCleared ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 75, 75, 0.15)', 
                            color: isCleared ? '#00e676' : '#ff4b4b' 
                          }}
                        >
                          {isCleared ? <><Unlock size={14} /> Cleared (Unlocked)</> : <><Lock size={14} /> Owing (Locked)</>}
                        </button>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button onClick={() => handleOpenPayment(s)} className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                            <DollarSign size={14} /> Record Payment
                          </button>
                          <button onClick={() => handleOpenAudit(s)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                            <History size={14} /> Audit Log
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Record Payment Modal */}
      {showPaymentModal && selectedStudent && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content animate-slide-up" style={{ maxWidth: '480px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-dark)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '800' }}>
                Record Fee Payment
              </h3>
              <button onClick={() => setShowPaymentModal(false)} style={{ background: 'none', border: 'none', color: 'hsl(var(--text-secondary))', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '14px', fontWeight: '700', margin: 0 }}>
                  {selectedStudent.first_name ? `${selectedStudent.first_name} ${selectedStudent.last_name}` : selectedStudent.name}
                </p>
                <p style={{ fontSize: '12px', color: 'hsl(var(--text-secondary))', marginTop: '2px' }}>
                  Admission No: {selectedStudent.admission_number}
                </p>
              </div>

              <div>
                <label className="form-label" style={{ marginBottom: '6px', display: 'block' }}>
                  Predefined Termly Fee / Total Due (₦)
                </label>
                <input 
                  type="number" 
                  className="glass-input" 
                  value={amountDue} 
                  onChange={(e) => setAmountDue(e.target.value)} 
                  required 
                />
              </div>

              <div>
                <label className="form-label" style={{ marginBottom: '6px', display: 'block' }}>
                  Amount Paid by Student (₦) *
                </label>
                <input 
                  type="number" 
                  className="glass-input" 
                  value={amountPaid} 
                  onChange={(e) => setAmountPaid(e.target.value)} 
                  placeholder="e.g. 150000" 
                  required 
                />
              </div>

              {/* Auto-Calculated Balance & Badge Display */}
              <div style={{ padding: '14px', borderRadius: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-dark)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '12px', color: 'hsl(var(--text-secondary))' }}>Auto-Calculated Balance:</span>
                  <div style={{ fontSize: '18px', fontWeight: '800', color: calculatedBalance === 0 ? '#00e676' : '#ffb400' }}>
                    ₦{calculatedBalance.toLocaleString()}
                  </div>
                </div>
                <div>
                  {calculatedBalance === 0 ? (
                    <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '12px', fontWeight: '800', background: 'rgba(0, 230, 118, 0.2)', color: '#00e676' }}>
                      CLEARED
                    </span>
                  ) : parseFloat(amountPaid) > 0 ? (
                    <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '12px', fontWeight: '800', background: 'rgba(255, 180, 0, 0.2)', color: '#ffb400' }}>
                      PARTIAL
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '12px', fontWeight: '800', background: 'rgba(255, 75, 75, 0.2)', color: '#ff4b4b' }}>
                      UNPAID
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submittingPayment}>
                  {submittingPayment ? (
                    <><span className="spinner spinner-sm"></span> Saving...</>
                  ) : (
                    <><DollarSign size={16} /> Save Payment & Update Clearance</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit Log Modal */}
      {showAuditModal && selectedStudent && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content animate-slide-up" style={{ maxWidth: '540px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-dark)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '800' }}>
                Financial Audit History
              </h3>
              <button onClick={() => setShowAuditModal(false)} style={{ background: 'none', border: 'none', color: 'hsl(var(--text-secondary))', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', marginBottom: '16px' }}>
              Financial trail for <strong>{selectedStudent.first_name ? `${selectedStudent.first_name} ${selectedStudent.last_name}` : selectedStudent.name}</strong> ({selectedStudent.admission_number})
            </p>

            {selectedStudent.fee_payments && selectedStudent.fee_payments[0]?.audit_trail ? (
              <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {JSON.parse(selectedStudent.fee_payments[0].audit_trail).map((log, idx) => (
                  <div key={idx} style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-dark)', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '700', color: '#7b93ff' }}>Paid: ₦{Number(log.amount_paid).toLocaleString()}</span>
                      <span style={{ fontSize: '11px', color: 'hsl(var(--text-secondary))' }}>{log.date}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'hsl(var(--text-secondary))' }}>Recorded by: {log.recorded_by || 'Bursar'}</p>
                    <p style={{ fontSize: '11px', color: log.status === 'paid' || log.status === 'cleared' ? '#00e676' : '#ffb400', marginTop: '2px', textTransform: 'uppercase', fontWeight: '700' }}>
                      Status: {log.status}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'hsl(var(--text-secondary))', padding: '20px 0', textAlign: 'center' }}>No payment audit trail records exist yet.</p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button type="button" onClick={() => setShowAuditModal(false)} className="btn-cancel">
                Close Audit Log
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FeePayments;
