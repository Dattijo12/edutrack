import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import bursarService from '../../services/bursarService';
import classService from '../../services/classService';

const FeePayments = () => {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Payment Modal State
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [amountDue, setAmountDue] = useState('150000');
  const [amountPaid, setAmountPaid] = useState('');

  useEffect(() => {
    classService.getAll().then(setClasses).catch(console.error);
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [selectedClass, statusFilter, search]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const data = await bursarService.getStudents(selectedClass, statusFilter, search);
      setStudents(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch fee payment records.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleClearance = async (student) => {
    const newStatus = !student.fee_cleared_status;
    try {
      await bursarService.toggleClearance(student.id, newStatus);
      setMessage(`Updated fee clearance for ${student.first_name} ${student.last_name}: ${newStatus ? 'CLEARED ✅' : 'OWING 🔒'}`);
      fetchStudents();
    } catch (err) {
      console.error(err);
      setError('Failed to toggle fee clearance status.');
    }
  };

  const handleOpenPayment = (student) => {
    setSelectedStudent(student);
    const existingPayment = student.fee_payments && student.fee_payments[0];
    if (existingPayment) {
      setAmountDue(existingPayment.amount_due || '150000');
      setAmountPaid(existingPayment.amount_paid || '');
    } else {
      setAmountDue('150000');
      setAmountPaid('');
    }
    setShowPaymentModal(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      await bursarService.recordPayment({
        student_id: selectedStudent.id,
        term_id: 1, // Current term
        amount_due: parseFloat(amountDue),
        amount_paid: parseFloat(amountPaid),
      });
      setMessage(`Payment recorded for ${selectedStudent.first_name} ${selectedStudent.last_name}!`);
      setShowPaymentModal(false);
      fetchStudents();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to record payment.');
    }
  };

  const handleOpenAudit = (student) => {
    setSelectedStudent(student);
    setShowAuditModal(true);
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }} className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '40px' }}>
        <Link to="/dashboard" style={{ color: '#00f2fe', textDecoration: 'none', fontSize: '14px', marginBottom: '15px', display: 'inline-block' }}>
          &larr; Back to Dashboard
        </Link>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px', marginBottom: '25px' }}>
          <div>
            <h2 style={{ fontSize: '28px', fontWeight: '700' }}>Bursar Fee Gatekeeper & Audit Logs</h2>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '14px', marginTop: '4px' }}>
              Track student tuition payments, toggle fee clearance, and lock report cards for owing students.
            </p>
          </div>
        </div>

        {message && (
          <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(75,255,125,0.15)', color: '#4bff7d', fontSize: '14px', marginBottom: '20px' }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(255,75,75,0.15)', color: '#ff4b4b', fontSize: '14px', marginBottom: '20px' }}>
            ❌ {error}
          </div>
        )}

        {/* Filter Toolbar */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="Search by student name or admission no..." 
            className="glass-input" 
            style={{ maxWidth: '320px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select className="glass-input" style={{ maxWidth: '200px' }} value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
            <option value="" style={{ color: '#000' }}>All Classes</option>
            {classes.map(c => (
              <option key={c.id} value={c.id} style={{ color: '#000' }}>{c.name} {c.arm}</option>
            ))}
          </select>

          <select className="glass-input" style={{ maxWidth: '200px' }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all" style={{ color: '#000' }}>All Clearance Statuses</option>
            <option value="cleared" style={{ color: '#000' }}>Cleared (Paid)</option>
            <option value="owing" style={{ color: '#000' }}>Owing (Report Card Locked)</option>
          </select>
        </div>

        {/* Student Fee List */}
        {loading ? (
          <p style={{ textAlign: 'center', color: 'hsl(var(--text-secondary))', padding: '40px' }}>Loading student fee records...</p>
        ) : students.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', background: 'rgba(0,0,0,0.15)', borderRadius: '12px', border: '1px dashed var(--border-dark)' }}>
            <p style={{ color: 'hsl(var(--text-secondary))' }}>No student records match filter criteria.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-dark)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: 'var(--table-header-bg)', borderBottom: '1px solid var(--border-dark)' }}>
                <tr>
                  <th style={{ padding: '14px 18px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>Admission No</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>Student Name</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>Class</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>Payment Status</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>Report Card Lock</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => {
                  const payment = s.fee_payments && s.fee_payments[0];
                  const isCleared = s.fee_cleared_status;
                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border-dark)' }}>
                      <td style={{ padding: '14px 18px', fontSize: '13px', color: 'hsl(var(--text-secondary))' }}>{s.admission_number}</td>
                      <td style={{ padding: '14px 18px', fontWeight: '600' }}>{s.first_name} {s.last_name}</td>
                      <td style={{ padding: '14px 18px', fontSize: '13px' }}>{s.class?.name} {s.class?.arm}</td>
                      <td style={{ padding: '14px 18px' }}>
                        {payment ? (
                          <span style={{ fontSize: '12px', padding: '4px 10px', borderRadius: '12px', fontWeight: '700', textTransform: 'uppercase', background: payment.payment_status === 'paid' ? 'rgba(0, 230, 118, 0.15)' : 'rgba(255, 180, 0, 0.15)', color: payment.payment_status === 'paid' ? '#00e676' : '#ffb400' }}>
                            {payment.payment_status} (Paid: ₦{Number(payment.amount_paid).toLocaleString()})
                          </span>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'hsl(var(--text-secondary))' }}>No record</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <button onClick={() => handleToggleClearance(s)} style={{ padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '12px', background: isCleared ? 'rgba(75,255,125,0.15)' : 'rgba(255,75,75,0.15)', color: isCleared ? '#4bff7d' : '#ff4b4b' }}>
                          {isCleared ? '🔓 Cleared (Unlocked)' : '🔒 Owing (Locked)'}
                        </button>
                      </td>
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <button onClick={() => handleOpenPayment(s)} className="btn-primary" style={{ padding: '6px 12px', fontSize: '12px', marginRight: '8px' }}>
                          Record Payment
                        </button>
                        <button onClick={() => handleOpenAudit(s)} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>
                          Audit Log
                        </button>
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
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '460px', padding: '35px', background: 'hsl(var(--card-dark))' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
              Record Payment — {selectedStudent.first_name} {selectedStudent.last_name}
            </h3>
            <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', marginBottom: '20px' }}>
              Admission No: {selectedStudent.admission_number}
            </p>

            <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>Total Tuition Fee Due (₦)</label>
                <input type="number" className="glass-input" value={amountDue} onChange={(e) => setAmountDue(e.target.value)} required />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>Amount Paid (₦)</label>
                <input type="number" className="glass-input" value={amountPaid} onChange={(e) => setAmountPaid(e.target.value)} required placeholder="e.g. 150000" />
              </div>

              <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', fontSize: '13px' }}>
                Balance Remaining: <strong style={{ color: (amountDue - amountPaid) > 0 ? '#ffb400' : '#4bff7d' }}>₦{Math.max(0, amountDue - amountPaid).toLocaleString()}</strong>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save & Clear Status</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit Log Modal */}
      {showAuditModal && selectedStudent && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '540px', padding: '35px', background: 'hsl(var(--card-dark))' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '6px' }}>
              Financial Audit Logs — {selectedStudent.first_name} {selectedStudent.last_name}
            </h3>
            <p style={{ fontSize: '12px', color: 'hsl(var(--text-secondary))', marginBottom: '20px' }}>
              Soft audit log history for financial transparency. Deletions disabled.
            </p>

            {selectedStudent.fee_payments && selectedStudent.fee_payments[0]?.audit_trail ? (
              <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {JSON.parse(selectedStudent.fee_payments[0].audit_trail).map((log, idx) => (
                  <div key={idx} style={{ padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-dark)', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontWeight: '700', color: '#7b93ff' }}>Paid: ₦{Number(log.amount_paid).toLocaleString()}</span>
                      <span style={{ fontSize: '11px', color: 'hsl(var(--text-secondary))' }}>{log.date}</span>
                    </div>
                    <p style={{ fontSize: '12px', color: 'hsl(var(--text-secondary))' }}>Recorded by: {log.recorded_by || 'Bursar'}</p>
                    <p style={{ fontSize: '11px', color: log.status === 'paid' ? '#4bff7d' : '#ffb400', marginTop: '2px', textTransform: 'uppercase', fontWeight: '600' }}>Status: {log.status}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'hsl(var(--text-secondary))', padding: '20px 0', textAlign: 'center' }}>No payment audit trail records exist yet.</p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button type="button" onClick={() => setShowAuditModal(false)} className="btn-secondary">Close Audit Log</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FeePayments;
