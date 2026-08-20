import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { GraduationCap, LogIn, Sun, Moon, Mail, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success('Signed in successfully! Welcome back.');
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      const responseData = err?.response?.data;
      const backendMessage =
        responseData?.message ||
        responseData?.errors?.email?.[0] ||
        responseData?.errors?.password?.[0];

      if (backendMessage) {
        toast.error(backendMessage);
      } else {
        const errMsg = typeof err?.message === 'string' ? err.message.toLowerCase() : '';
        if (errMsg.includes('network error') || errMsg.includes('econnrefused') || errMsg.includes('timeout')) {
          toast.error('Unable to reach backend server. Ensure it is running.');
        } else {
          toast.error('Failed to log in. Please check your credentials.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const autofillUser = (roleEmail, rolePass) => {
    setEmail(roleEmail);
    setPassword(rolePass);
    toast.info(`Autofilled demo credentials for ${roleEmail}`);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '40px' }}>
        
        {/* Header with Theme Toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px hsla(var(--primary), 0.4)'
            }}>
              <GraduationCap size={24} color="#fff" />
            </div>
            <div>
              <h1 style={{
                fontSize: '26px',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #7b93ff 0%, #ff7be1 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                EduTrack
              </h1>
              <p style={{ fontSize: '12px', color: 'hsl(var(--text-secondary))', marginTop: '1px' }}>
                School Management System
              </p>
            </div>
          </div>
          
          <button 
            onClick={toggleTheme}
            className="btn-secondary" 
            style={{ padding: '8px 12px', borderRadius: '10px' }}
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={18} color="#ffb400" /> : <Moon size={18} color="#7b93ff" />}
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-secondary))' }} />
              <input 
                type="email" 
                className="glass-input"
                style={{ paddingLeft: '38px' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. admin@school.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-secondary))' }} />
              <input 
                type="password" 
                className="glass-input"
                style={{ paddingLeft: '38px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', marginTop: '8px' }}>
            {loading ? (
              <>
                <span className="spinner spinner-sm"></span> Processing...
              </>
            ) : (
              <>
                <LogIn size={18} /> Sign In
              </>
            )}
          </button>
        </form>

        {/* Demo Quick Logins Helper */}
        <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--border-dark)' }}>
          <p style={{ fontSize: '11px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', textAlign: 'center', fontWeight: '600' }}>
            Quick Demo Logins:
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
