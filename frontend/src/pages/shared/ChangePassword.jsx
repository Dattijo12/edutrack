import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, KeyRound, Lock, ShieldCheck, PenTool, Upload, CheckCircle2 } from 'lucide-react';
import authService from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

/**
 * ChangePassword & Staff Account Security Component
 * Allows teachers, form masters, and staff to update their password
 * and upload/preview their official digital signature for report card sign-offs.
 */
const ChangePassword = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);

  // Signature state
  const [signatureUrl, setSignatureUrl] = useState(user?.signature_url || null);
  const [signatureFile, setSignatureFile] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);
  const [uploadingSig, setUploadingSig] = useState(false);

  useEffect(() => {
    // Refresh user profile to fetch current signature_url
    authService.getProfile()
      .then((res) => {
        if (res?.user?.signature_url) {
          setSignatureUrl(res.user.signature_url);
        }
      })
      .catch(() => {});
  }, []);

  const handlePasswordSubmit = async (e) => {
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
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirmation('');
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || err?.response?.data?.error || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignatureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Signature image file must be under 2MB.');
        return;
      }
      setSignatureFile(file);
      setSignaturePreview(URL.createObjectURL(file));
    }
  };

  const handleSignatureUpload = async () => {
    if (!signatureFile) return;

    setUploadingSig(true);
    try {
      const res = await authService.uploadSignature(signatureFile);
      toast.success('Official signature uploaded and activated successfully!');
      if (res?.signature_url) {
        setSignatureUrl(res.signature_url);
      }
      setSignatureFile(null);
      setSignaturePreview(null);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || 'Failed to upload signature image.');
    } finally {
      setUploadingSig(false);
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '680px', margin: '20px auto' }} className="animate-fade-in space-y-6">
      
      {/* 1. Official Digital Signature Card (Form Masters & Teaching Staff) */}
      <div className="glass-panel" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(235, 92, 180, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PenTool size={20} color="#ff7be1" />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Official Report Card Signature</h2>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '13px', marginTop: '2px' }}>
              Your signature appears on terminal report cards for students in your assigned class.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-dark)', marginBottom: '16px' }}>
          <div style={{
            width: '140px',
            height: '65px',
            borderRadius: '10px',
            border: '2px dashed var(--border-dark)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.2)',
            overflow: 'hidden',
          }}>
            {signaturePreview || signatureUrl ? (
              <img 
                src={signaturePreview || signatureUrl} 
                alt="Signature Preview" 
                style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }}
              />
            ) : (
              <span style={{ fontFamily: 'cursive', fontSize: '15px', fontStyle: 'italic', color: '#ff7be1', opacity: 0.8 }}>
                {user?.name || 'Sign Here'}
              </span>
            )}
          </div>

          <div style={{ flex: 1 }}>
            <label 
              htmlFor="staff-sig-input" 
              className="btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '8px 14px', fontSize: '12px', borderRadius: '8px' }}
            >
              <Upload size={14} /> Choose Signature Image
            </label>
            <input 
              id="staff-sig-input"
              type="file" 
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={handleSignatureChange}
              style={{ display: 'none' }}
            />
            {signatureFile && (
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', color: '#00e676', fontWeight: '600' }}>
                  ✓ {signatureFile.name}
                </span>
                <button
                  type="button"
                  onClick={handleSignatureUpload}
                  disabled={uploadingSig}
                  className="btn-primary"
                  style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '6px' }}
                >
                  {uploadingSig ? 'Uploading...' : 'Save Signature'}
                </button>
              </div>
            )}
            <p style={{ fontSize: '11px', color: 'hsl(var(--text-secondary))', marginTop: '6px' }}>
              PNG or JPG with transparent/white background (max 2MB). If unuploaded, a clean cursive digital signature is used automatically.
            </p>
          </div>
        </div>
      </div>

      {/* 2. Password Security Settings Card */}
      <div className="glass-panel" style={{ padding: '36px' }}>
        
        <Link to="/dashboard" className="back-link" style={{ marginBottom: '16px' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(92, 124, 250, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <KeyRound size={22} color="#7b93ff" />
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: '700' }}>Account Password Security</h2>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '13px', marginTop: '2px' }}>
              Ensure your account is protected with a secure password.
            </p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
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
                <><span className="spinner spinner-sm"></span> Updating Password...</>
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
