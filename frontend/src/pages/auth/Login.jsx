import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      const responseData = err?.response?.data;
      const backendMessage =
        responseData?.message ||
        responseData?.errors?.email?.[0] ||
        responseData?.errors?.password?.[0];

      if (backendMessage) {
        setError(backendMessage);
        return;
      }

      const errMsg = typeof err?.message === 'string' ? err.message.toLowerCase() : '';
      if (errMsg.includes('network error') || errMsg.includes('econnrefused') || errMsg.includes('timeout')) {
        setError('Unable to reach login server. Please make sure the backend is running and try again.');
        return;
      }

      setError('Failed to log in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const autofillUser = (roleEmail, rolePass) => {
    setEmail(roleEmail);
    setPassword(rolePass);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '40px' }}>
        
        {/* Header with Theme Toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '800', background: 'linear-gradient(135deg, #7b93ff 0%, #ff7be1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              EduTrack
            </h1>
            <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', marginTop: '2px' }}>
              School Management System Portal
            </p>
          </div>
          <button 
            onClick={toggleTheme}
            className="btn-secondary" 
            style={{ padding: '8px 12px', fontSize: '16px' }}
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>

        {error && (
          <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(255,75,75,0.15)', border: '1px solid rgba(255,75,75,0.3)', color: '#ff4b4b', fontSize: '13px', marginBottom: '20px', fontWeight: '500' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>
              Email Address
            </label>
            <input 
              type="email" 
              className="glass-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@school.com"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>
              Password
            </label>
            <input 
              type="password" 
              className="glass-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '10px' }}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Demo Quick Logins Helper */}
        <div style={{ marginTop: '35px', paddingTop: '20px', borderTop: '1px solid var(--border-dark)' }}>
          <p style={{ fontSize: '11px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', textAlign: 'center' }}>
            Quick Demo Logins (Click to Autofill):
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
            <button onClick={() => autofillUser('admin@school.com', 'admin123')} className="badge badge-admin" style={{ cursor: 'pointer', border: 'none' }}>
              Super Admin
            </button>
            <button onClick={() => autofillUser('officer@school.com', 'officer123')} className="badge badge-exam_officer" style={{ cursor: 'pointer', border: 'none' }}>
              Exam Officer
            </button>
            <button onClick={() => autofillUser('bursar@school.com', 'bursar123')} className="badge badge-bursar" style={{ cursor: 'pointer', border: 'none' }}>
              Bursar
            </button>
            <button onClick={() => autofillUser('formmaster@school.com', 'master123')} className="badge badge-form_master" style={{ cursor: 'pointer', border: 'none' }}>
              Form Master
            </button>
            <button onClick={() => autofillUser('teacher@school.com', 'teacher123')} className="badge badge-teacher" style={{ cursor: 'pointer', border: 'none' }}>
              Subject Teacher
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
