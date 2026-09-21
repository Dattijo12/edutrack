import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, XCircle, GraduationCap, ArrowLeft } from 'lucide-react';
import examOfficerService from '../../services/examOfficerService';

const VerifyResult = () => {
  const { hash } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    /* Guard: If no hash is provided (e.g. direct sidebar navigation), halt the
       loading state immediately and display a user-friendly validation error. */
    if (!hash) {
      setError('Verification code is missing or invalid. Please scan the QR code on the printed report card.');
      setLoading(false);
      return;
    }

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
    verify();
  }, [hash]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '520px', padding: '40px', textAlign: 'center' }}>
        
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto',
          boxShadow: '0 4px 20px hsla(var(--primary), 0.4)'
        }}>
          <GraduationCap size={28} color="#fff" />
        </div>

        <h1 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '6px', background: 'linear-gradient(135deg, #7b93ff 0%, #ff7be1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          EduTrack Verification Portal
        </h1>
        <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', marginBottom: '28px' }}>
          Official Anti-Forgery Student Result Authenticator
        </p>

        {loading ? (
          <div className="page-loading" style={{ padding: '30px' }}>
            <span className="spinner"></span>
            <p>Verifying digital QR security signature...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '24px', borderRadius: '12px', background: 'rgba(255,75,75,0.12)', border: '1px solid rgba(255,75,75,0.3)', color: '#ff4b4b' }}>
            <XCircle size={40} color="#ff4b4b" style={{ marginBottom: '10px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>INVALID RESULT</h3>
            <p style={{ fontSize: '13px', lineHeight: '1.5' }}>{error}</p>
          </div>
        ) : (
          <div style={{ padding: '24px', borderRadius: '12px', background: 'rgba(75,255,125,0.1)', border: '1px solid rgba(75,255,125,0.3)', textAlign: 'left' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px', borderBottom: '1px solid rgba(75,255,125,0.2)', paddingBottom: '14px' }}>
              <ShieldCheck size={28} color="#4bff7d" />
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '800', color: '#4bff7d', letterSpacing: '0.5px' }}>{data.message}</h3>
                <p style={{ fontSize: '11px', color: 'hsl(var(--text-secondary))' }}>Issued by {data.school_name}</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '13px' }}>
              <div>
                <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600' }}>Student Name</p>
                <p style={{ fontWeight: '700', marginTop: '2px' }}>{data.student}</p>
              </div>
              <div>
                <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600' }}>Admission Number</p>
                <p style={{ fontWeight: '700', marginTop: '2px' }}>{data.admission_number}</p>
              </div>
              <div>
                <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600' }}>Class</p>
                <p style={{ fontWeight: '700', marginTop: '2px' }}>{data.class}</p>
              </div>
              <div>
                <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600' }}>Session / Term</p>
                <p style={{ fontWeight: '700', marginTop: '2px' }}>{data.session} - {data.term}</p>
              </div>
            </div>

            <div style={{ marginTop: '18px', paddingTop: '14px', borderTop: '1px dashed rgba(255,255,255,0.1)', fontSize: '11px', color: 'hsl(var(--text-secondary))', textAlign: 'center' }}>
              Verification Timestamp: {data.timestamp}
            </div>
          </div>
        )}

        <div style={{ marginTop: '28px' }}>
          <Link to="/login" className="btn-secondary">
            <ArrowLeft size={16} /> Return to Portal Login
          </Link>
        </div>

      </div>
    </div>
  );
};

export default VerifyResult;
