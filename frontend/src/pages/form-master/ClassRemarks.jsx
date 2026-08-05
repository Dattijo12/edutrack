import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import formMasterService from '../../services/formMasterService';

const ClassRemarks = () => {
  const [assignedClass, setAssignedClass] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);

  const [formMasterRemark, setFormMasterRemark] = useState('');
  const [principalRemark, setPrincipalRemark] = useState('');
  const [attendancePresent, setAttendancePresent] = useState('65');
  const [attendanceTotal, setAttendanceTotal] = useState('70');

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    formMasterService.getAssignedClass()
      .then(data => {
        setAssignedClass(data);
        if (data && data.students && data.students.length > 0) {
          setSelectedStudent(data.students[0]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSaveRemarks = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !assignedClass) return;

    setMessage('');
    setError('');
    setSaving(true);

    try {
      await formMasterService.updateRemarks({
        student_id: selectedStudent.id,
        class_id: assignedClass.id,
        term_id: 1,
        form_master_remark: formMasterRemark,
        principal_remark: principalRemark,
        attendance_present: parseInt(attendancePresent),
        attendance_total: parseInt(attendanceTotal),
      });
      setMessage(`✅ Terminal remarks & attendance saved for ${selectedStudent.first_name || selectedStudent.name}!`);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to save remarks.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1100px', margin: '0 auto' }} className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '40px' }}>
        <Link to="/dashboard" style={{ color: '#00f2fe', textDecoration: 'none', fontSize: '14px', marginBottom: '15px', display: 'inline-block' }}>
          &larr; Back to Dashboard
        </Link>
        
        <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '4px' }}>Form Master Class Console</h2>
        <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '14px', marginBottom: '30px' }}>
          Input terminal conduct remarks, attendance, and principal endorsements for your assigned class.
        </p>

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

        {loading ? (
          <p style={{ textAlign: 'center', color: 'hsl(var(--text-secondary))', padding: '30px' }}>Loading assigned class...</p>
        ) : !assignedClass ? (
          <div style={{ padding: '40px', textAlign: 'center', background: 'rgba(0,0,0,0.1)', borderRadius: '12px' }}>
            <p style={{ color: 'hsl(var(--text-secondary))' }}>No class currently assigned to your Form Master profile.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
            
            {/* Left: Students List */}
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px' }}>
                Class Roster — {assignedClass.name} {assignedClass.arm} ({assignedClass.students?.length || 0} Students)
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '420px', overflowY: 'auto' }}>
                {assignedClass.students?.map(s => {
                  const isSelected = selectedStudent?.id === s.id;
                  return (
                    <div 
                      key={s.id} 
                      onClick={() => setSelectedStudent(s)}
                      style={{
                        padding: '12px 16px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        background: isSelected ? 'rgba(123, 147, 255, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                        border: isSelected ? '1px solid #7b93ff' : '1px solid var(--border-dark)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <p style={{ fontWeight: '700', fontSize: '14px', color: isSelected ? '#7b93ff' : 'hsl(var(--text-primary))' }}>
                        {s.first_name ? `${s.first_name} ${s.last_name}` : s.name}
                      </p>
                      <p style={{ fontSize: '11px', color: 'hsl(var(--text-secondary))', marginTop: '2px' }}>
                        {s.admission_number}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Remarks & Attendance Form */}
            {selectedStudent ? (
              <form onSubmit={handleSaveRemarks} style={{ background: 'rgba(0,0,0,0.12)', padding: '25px', borderRadius: '12px', border: '1px solid var(--border-dark)' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px' }}>
                  Endorsements for {selectedStudent.first_name ? `${selectedStudent.first_name} ${selectedStudent.last_name}` : selectedStudent.name}
                </h3>
                <p style={{ fontSize: '12px', color: 'hsl(var(--text-secondary))', marginBottom: '20px' }}>
                  Admission Number: {selectedStudent.admission_number}
                </p>

                {/* Attendance */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>Days Present</label>
                    <input type="number" className="glass-input" value={attendancePresent} onChange={(e) => setAttendancePresent(e.target.value)} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>Total School Days</label>
                    <input type="number" className="glass-input" value={attendanceTotal} onChange={(e) => setAttendanceTotal(e.target.value)} required />
                  </div>
                </div>

                {/* Form Master Remark */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>Form Master Terminal Remark</label>
                  <textarea 
                    rows={3} 
                    className="glass-input" 
                    value={formMasterRemark} 
                    onChange={(e) => setFormMasterRemark(e.target.value)} 
                    placeholder="e.g. An attentive and well-behaved student. Showed notable improvement in science subjects."
                  />
                </div>

                {/* Principal Remark */}
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>Principal Terminal Remark</label>
                  <textarea 
                    rows={3} 
                    className="glass-input" 
                    value={principalRemark} 
                    onChange={(e) => setPrincipalRemark(e.target.value)} 
                    placeholder="e.g. Good result. Recommended for promotion to the next level."
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : '💾 Save Terminal Remarks'}
                  </button>
                </div>
              </form>
            ) : (
              <p style={{ color: 'hsl(var(--text-secondary))', padding: '30px' }}>Select a student from the left roster.</p>
            )}

          </div>
        )}

      </div>
    </div>
  );
};

export default ClassRemarks;
