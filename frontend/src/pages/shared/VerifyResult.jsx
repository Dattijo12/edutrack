import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import examOfficerService from '../../services/examOfficerService';

const VerifyResult = () => {
  const { hash } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await examOfficerService.verifyResult(hash);
        setData(res);
      } catch (err) {
        console.error(err);
        setError('This result QR verification code is invalid, altered, or unverified.');
      } finally {
        setLoading(false);
      }
    };
    if (hash) verify();
  }, [hash]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '520px', padding: '40px', textAlign: 'center' }}>
        
        <h1 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '8px', color: '#7b93ff' }}>
          EduTrack Verification Portal
        </h1>
        <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', marginBottom: '30px' }}>
          Official Anti-Forgery Student Result Authenticator
        </p>

        {loading ? (
          <p style={{ color: 'hsl(var(--text-secondary))', padding: '30px' }}>Verifying QR digital signature...</p>
        ) : error ? (
          <div style={{ padding: '25px', borderRadius: '12px', background: 'rgba(255,75,75,0.12)', border: '1px solid rgba(255,75,75,0.3)', color: '#ff4b4b' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '10px' }}>❌ INVALID RESULT</h3>
            <p style={{ fontSize: '14px', lineHeight: '1.5' }}>{error}</p>
          </div>
        ) : (
          <div style={{ padding: '25px', borderRadius: '12px', background: 'rgba(75,255,125,0.1)', border: '1px solid rgba(75,255,125,0.3)', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid rgba(75,255,125,0.2)', paddingBottom: '12px' }}>
              <span style={{ fontSize: '24px' }}>✅</span>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#4bff7d', letterSpacing: '1px' }}>{data.message}</h3>
                <p style={{ fontSize: '11px', color: 'hsl(var(--text-secondary))' }}>Issued by {data.school_name}</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', fontSize: '13px' }}>
              <div>
                <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '11px', textTransform: 'uppercase' }}>Student Name</p>
                <p style={{ fontWeight: '700', marginTop: '2px' }}>{data.student}</p>
              </div>
              <div>
                <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '11px', textTransform: 'uppercase' }}>Admission Number</p>
                <p style={{ fontWeight: '700', marginTop: '2px' }}>{data.admission_number}</p>
              </div>
              <div>
                <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '11px', textTransform: 'uppercase' }}>Class</p>
                <p style={{ fontWeight: '700', marginTop: '2px' }}>{data.class}</p>
              </div>
              <div>
                <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '11px', textTransform: 'uppercase' }}>Session / Term</p>
                <p style={{ fontWeight: '700', marginTop: '2px' }}>{data.session} - {data.term}</p>
              </div>
            </div>

            <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px dashed rgba(255,255,255,0.1)', fontSize: '11px', color: 'hsl(var(--text-secondary))', textAlign: 'center' }}>
              Verification Timestamp: {data.timestamp}
            </div>
          </div>
        )}

        <div style={{ marginTop: '30px' }}>
          <Link to="/login" className="btn-secondary" style={{ textDecoration: 'none' }}>
            Return to Portal Login
          </Link>
        </div>

      </div>
    </div>
  );
};

export default VerifyResult;
