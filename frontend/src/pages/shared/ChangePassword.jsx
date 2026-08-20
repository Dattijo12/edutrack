import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, KeyRound, Lock, ShieldCheck } from 'lucide-react';
import authService from '../../services/authService';

const ChangePassword = () => {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== newPasswordConfirmation) {
      toast.error('New passwords do not match!');
      return;
    }

    setLoading(true);

    try {
      await authService.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: newPasswordConfirmation,
      });
      toast.success('Password updated successfully!');
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || err?.response?.data?.error || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '540px', margin: '30px auto' }} className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '36px' }}>
        
        <Link to="/dashboard" className="back-link" style={{ marginBottom: '16px' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(92, 124, 250, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <KeyRound size={22} color="#7b93ff" />
          </div>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '700' }}>Security Settings</h2>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '13px', marginTop: '2px' }}>
              Update your account password.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label className="form-label">Current Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-secondary))' }} />
              <input 
                type="password" 
                className="glass-input" 
                style={{ paddingLeft: '38px' }}
                value={currentPassword} 
                onChange={(e) => setCurrentPassword(e.target.value)} 
                required 
              />
            </div>
          </div>

          <div>
            <label className="form-label">New Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-secondary))' }} />
              <input 
                type="password" 
                className="glass-input" 
                style={{ paddingLeft: '38px' }}
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                required 
                minLength={6}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <ShieldCheck size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-secondary))' }} />
              <input 
                type="password" 
                className="glass-input" 
                style={{ paddingLeft: '38px' }}
                value={newPasswordConfirmation} 
                onChange={(e) => setNewPasswordConfirmation(e.target.value)} 
                required 
                minLength={6}
              />
            </div>
          </div>

          <div style={{ marginTop: '8px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" onClick={() => navigate('/dashboard')} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <><span className="spinner spinner-sm"></span> Updating...</>
              ) : (
                <><KeyRound size={16} /> Update Password</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangePassword;
