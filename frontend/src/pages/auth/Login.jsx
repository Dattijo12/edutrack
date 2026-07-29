import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.message || 
        err.response?.data?.errors?.email?.[0] || 
        'Failed to log in. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Quick fill helper for review/demo purposes
  const handleQuickFill = (roleEmail, rolePass) => {
    setEmail(roleEmail);
    setPassword(rolePass);
  };

  return (
    <div className="flex-center animate-fade-in" style={{ minHeight: '90vh', padding: '20px' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '420px', padding: '40px 30px' }}>
        
        {/* App Logo & Header */}
        <div style={{ textAlign: 'center', marginBottom: '35px' }}>
          <h1 style={{
            fontSize: '36px',
            fontWeight: '800',
            background: 'linear-gradient(135deg, hsl(var(--primary-glow)) 0%, hsl(var(--secondary)) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.5px',
            marginBottom: '6px'
          }}>
            EduTrack
          </h1>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '14px' }}>
            School Management System Portal
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div style={{
            background: 'rgba(255, 75, 75, 0.15)',
            border: '1px solid rgba(255, 75, 75, 0.3)',
            borderRadius: '8px',
            padding: '12px 16px',
            color: '#ff6b6b',
            fontSize: '14px',
            marginBottom: '20px',
            lineHeight: '1.4'
          }}>
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'hsl(var(--text-secondary))', marginBottom: '6px' }}>
              Email Address
            </label>
            <input
              type="email"
              className="glass-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@school.com"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: 'hsl(var(--text-secondary))', marginBottom: '6px' }}>
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

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ marginTop: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Demo Fast Login Helpers */}
        <div style={{ marginTop: '35px', paddingTop: '25px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <p style={{ fontSize: '12px', color: 'hsl(var(--text-secondary))', textAlign: 'center', marginBottom: '12px' }}>
            Quick Demo Logins
          </p>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
            <button
              onClick={() => handleQuickFill('admin@school.com', 'admin123')}
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '6px',
                padding: '8px 4px',
                fontSize: '11px',
                color: 'hsl(var(--text-primary))',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.08)'}
              onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.04)'}
            >
              Admin
            </button>
            <button
              onClick={() => handleQuickFill('teacher@school.com', 'teacher123')}
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '6px',
                padding: '8px 4px',
                fontSize: '11px',
                color: 'hsl(var(--text-primary))',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.08)'}
              onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.04)'}
            >
              Teacher
            </button>
            <button
              onClick={() => handleQuickFill('officer@school.com', 'officer123')}
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '6px',
                padding: '8px 4px',
                fontSize: '11px',
                color: 'hsl(var(--text-primary))',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.08)'}
              onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.04)'}
            >
              Exam Officer
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
