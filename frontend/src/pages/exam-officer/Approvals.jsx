import React, { useEffect, useState } from 'react';
import examOfficerService from '../../services/examOfficerService';
import { Link } from 'react-router-dom';

const Approvals = () => {
  const [pendingResults, setPendingResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const data = await examOfficerService.getPendingResults();
      setPendingResults(data);
    } catch (error) {
      console.error(error);
      setMessage('Failed to load pending results.');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, actionType) => {
    try {
      if (actionType === 'approve') {
        await examOfficerService.approveResult(id);
      } else {
        await examOfficerService.rejectResult(id);
      }
      
      setPendingResults(pendingResults.filter(r => r.id !== id));
      setMessage(`Result successfully ${actionType}d.`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error(error);
      setMessage(`Failed to ${actionType} result.`);
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }} className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '40px' }}>
        <div style={{ marginBottom: '30px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '20px' }}>
          <Link to="/dashboard" style={{ color: '#00f2fe', textDecoration: 'none', fontSize: '14px', marginBottom: '10px', display: 'inline-block' }}>&larr; Back to Dashboard</Link>
          <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>Pending Approvals</h2>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '15px' }}>Review and approve teacher-submitted student grades.</p>
        </div>

        {message && (
          <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', background: message.includes('Failed') ? 'rgba(255,75,75,0.15)' : 'rgba(75,255,125,0.15)', color: message.includes('Failed') ? '#ff4b4b' : '#4bff7d', fontSize: '14px', fontWeight: '500' }}>
            {message}
          </div>
        )}

        {loading ? (
          <p style={{ textAlign: 'center', color: 'hsl(var(--text-secondary))', padding: '40px' }}>Loading pending results...</p>
        ) : pendingResults.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', background: 'rgba(0,0,0,0.15)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '16px' }}>Hooray! No pending results to approve.</p>
          </div>
        ) : (
          <div style={{ borderRadius: '12px', overflow: 'x-auto', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(0,0,0,0.2)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
              <thead style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <tr>
                  <th style={{ padding: '16px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase', letterSpacing: '1px' }}>ID</th>
                  <th style={{ padding: '16px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase', letterSpacing: '1px' }}>Student</th>
                  <th style={{ padding: '16px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase', letterSpacing: '1px' }}>Class</th>
                  <th style={{ padding: '16px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase', letterSpacing: '1px' }}>Subject</th>
                  <th style={{ padding: '16px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase', letterSpacing: '1px' }}>Term/Session</th>
                  <th style={{ padding: '16px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>Score</th>
                  <th style={{ padding: '16px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>Grade</th>
                  <th style={{ padding: '16px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase', letterSpacing: '1px' }}>Teacher</th>
                  <th style={{ padding: '16px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingResults.map(result => (
                  <tr key={result.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '16px', color: 'hsl(var(--text-secondary))', fontSize: '13px' }}>#{result.id}</td>
                    <td style={{ padding: '16px', fontWeight: '500' }}>{result.student?.name}</td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>{result.student?.class?.name}</td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>{result.subject?.name}</td>
                    <td style={{ padding: '16px', fontSize: '13px', color: 'hsl(var(--text-secondary))' }}>Term {result.term} <br/><span style={{ fontSize: '11px' }}>{result.academic_session}</span></td>
                    <td style={{ padding: '16px', textAlign: 'center', fontSize: '14px' }}>
                      {result.ca_score} + {result.exam_score} = <span style={{ fontWeight: 'bold', color: 'hsl(var(--text-primary))' }}>{result.total_score}</span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center', fontWeight: 'bold', color: '#00f2fe' }}>{result.grade}</td>
                    <td style={{ padding: '16px', fontSize: '14px', color: 'hsl(var(--text-secondary))' }}>{result.teacher?.name}</td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button onClick={() => handleAction(result.id, 'approve')} style={{ padding: '6px 12px', background: 'rgba(75,255,125,0.2)', color: '#4bff7d', border: '1px solid rgba(75,255,125,0.3)', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                          Approve
                        </button>
                        <button onClick={() => handleAction(result.id, 'reject')} style={{ padding: '6px 12px', background: 'rgba(255,75,75,0.2)', color: '#ff4b4b', border: '1px solid rgba(255,75,75,0.3)', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Approvals;
