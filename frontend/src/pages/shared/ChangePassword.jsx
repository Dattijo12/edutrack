import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../../services/authService';

const ChangePassword = () => {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword !== newPasswordConfirmation) {
      setError('New passwords do not match!');
      return;
    }

    setLoading(true);

    try {
      await authService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: newPasswordConfirmation,
      });
      setMessage('✅ Password updated successfully! Redirecting...');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || err?.response?.data?.error || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '600px', margin: '40px auto' }} className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '40px' }}>
        <Link to="/dashboard" style={{ color: '#00f2fe', textDecoration: 'none', fontSize: '14px', marginBottom: '15px', display: 'inline-block' }}>
          &larr; Back to Dashboard
        </Link>
        <h2 style={{ fontSize: '26px', fontWeight: '700', marginBottom: '8px' }}>Security Settings</h2>
        <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '14px', marginBottom: '30px' }}>
          Update your account password. Use a strong password containing numbers and symbols.
        </p>

        {message && (
          <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(75,255,125,0.15)', color: '#4bff7d', fontSize: '14px', marginBottom: '20px', fontWeight: '500' }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(255,75,75,0.15)', color: '#ff4b4b', fontSize: '14px', marginBottom: '20px', fontWeight: '500' }}>
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Current Password
            </label>
            <input 
              type="password" 
              className="glass-input" 
              value={currentPassword} 
              onChange={(e) => setCurrentPassword(e.target.value)} 
              required 
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase', letterSpacing: '1px' }}>
              New Password
            </label>
            <input 
              type="password" 
              className="glass-input" 
              value={newPassword} 
              onChange={(e) => setNewPassword(e.target.value)} 
              required 
              minLength={6}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Confirm New Password
            </label>
            <input 
              type="password" 
              className="glass-input" 
              value={newPasswordConfirmation} 
              onChange={(e) => setNewPasswordConfirmation(e.target.value)} 
              required 
              minLength={6}
            />
          </div>

          <div style={{ marginTop: '10px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
