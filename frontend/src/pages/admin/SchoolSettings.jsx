import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { Settings, Save, Sliders, Building2, Phone, Mail, Upload, Image as ImageIcon } from 'lucide-react';
import adminService from '../../services/adminService';
import { useSchool } from '../../context/SchoolContext';

const SchoolSettings = () => {
  const { refreshSchool } = useSchool();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    max_ca_score: 30,
    max_exam_score: 70,
  });
  
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [currentLogoUrl, setCurrentLogoUrl] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    adminService.getSettings()
      .then(data => {
        setFormData({
          name: data.name || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          max_ca_score: data.max_ca_score || 30,
          max_exam_score: data.max_exam_score || 70,
        });
        if (data.logo_url) {
          setCurrentLogoUrl(data.logo_url);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch settings:', err);
        toast.error('Failed to load school settings.');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image size must be less than 2MB.');
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const ca = parseFloat(formData.max_ca_score);
    const exam = parseFloat(formData.max_exam_score);

    if (ca + exam !== 100) {
      toast.error(`CA Score (${ca}) + Exam Score (${exam}) must total exactly 100%! Current total: ${ca + exam}%`);
      return;
    }

    setSubmitting(true);

    try {
      // Use FormData to include binary image file
      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('address', formData.address);
      payload.append('phone', formData.phone);
      payload.append('email', formData.email);
      payload.append('max_ca_score', formData.max_ca_score);
      payload.append('max_exam_score', formData.max_exam_score);

      if (logoFile) {
        payload.append('logo', logoFile);
      }

      const res = await adminService.updateSettings(payload);
      toast.success('School settings and logo updated successfully!');

      if (res?.data?.logo_url) {
        setCurrentLogoUrl(res.data.logo_url);
      }

      // Refresh global school context to update sidebar header and dashboard
      refreshSchool();
    } catch (err) {
      console.error('Save settings error:', err);
      toast.error(err?.response?.data?.message || 'Failed to update settings.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }} className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '40px' }}>
        
        {/* Module Header */}
        <div style={{ marginBottom: '30px', borderBottom: '1px solid var(--border-dark)', paddingBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(92, 124, 250, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Settings size={22} color="#7b93ff" />
            </div>
            <div>
              <h2 style={{ fontSize: '26px', fontWeight: '800' }}>School & Grading Configuration</h2>
              <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '14px', marginTop: '2px' }}>
                Configure school branding, logo emblem, contact information, and dynamic score boundaries.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="page-loading">
            <span className="spinner"></span>
            <p>Loading school settings & configuration...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* School Logo Upload Section */}
            <div style={{ padding: '24px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-dark)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <ImageIcon size={20} color="#7b93ff" />
                <h3 style={{ fontSize: '16px', fontWeight: '700' }}>
                  School Emblem / Logo Upload
                </h3>
              </div>
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', marginBottom: '18px', lineHeight: '1.4' }}>
                The uploaded logo image will be displayed on the top left sidebar header, dashboard overview, and student report card templates. (PNG, JPG up to 2MB)
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                <div style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '14px',
                  border: '2px dashed var(--border-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0,0,0,0.15)',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  {logoPreview || currentLogoUrl ? (
                    <img 
                      src={logoPreview || currentLogoUrl} 
                      alt="School Logo Preview" 
                      style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }}
                    />
                  ) : (
                    <Building2 size={36} style={{ opacity: 0.3 }} />
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ marginBottom: '8px' }}>Select Image File</label>
                  <label 
                    htmlFor="logo-input" 
                    className="btn-secondary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '10px 18px', borderRadius: '10px' }}
                  >
                    <Upload size={16} /> Choose Logo File
                  </label>
                  <input 
                    id="logo-input"
                    type="file" 
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={handleLogoChange}
                    style={{ display: 'none' }}
                  />
                  {logoFile && (
                    <span style={{ marginLeft: '12px', fontSize: '13px', color: '#00e676', fontWeight: '600' }}>
                      Selected: {logoFile.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Dynamic Score Limits Box */}
            <div style={{ padding: '24px', borderRadius: '14px', background: 'rgba(123, 147, 255, 0.08)', border: '1px solid rgba(123, 147, 255, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <Sliders size={20} color="#7b93ff" />
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#7b93ff' }}>
                  Dynamic CA / Exam Max Limits (Validation Engine)
                </h3>
              </div>
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', marginBottom: '18px', lineHeight: '1.4' }}>
                All teacher score inputs will strictly validate against these bounds in real-time. (CA + Exam must total 100%)
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label className="form-label">Max CA Score (e.g. 30 or 40)</label>
                  <input 
                    type="number" 
                    className="glass-input" 
                    min={10} 
                    max={50}
                    value={formData.max_ca_score} 
                    onChange={(e) => setFormData({ ...formData, max_ca_score: e.target.value })} 
                    required 
                  />
                </div>

                <div>
                  <label className="form-label">Max Exam Score (e.g. 70 or 60)</label>
                  <input 
                    type="number" 
                    className="glass-input" 
                    min={50} 
                    max={90}
                    value={formData.max_exam_score} 
                    onChange={(e) => setFormData({ ...formData, max_exam_score: e.target.value })} 
                    required 
                  />
                </div>
              </div>
            </div>

            {/* School Profile Information */}
            <div>
              <label className="form-label">School Name</label>
              <div style={{ position: 'relative' }}>
                <Building2 size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-secondary))' }} />
                <input 
                  type="text" 
                  className="glass-input" 
                  style={{ paddingLeft: '38px' }}
                  value={formData.name} 
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                  required 
                />
              </div>
            </div>

            <div>
              <label className="form-label">School Address</label>
              <input 
                type="text" 
                className="glass-input" 
                value={formData.address} 
                onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
                required 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label className="form-label">Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <Phone size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-secondary))' }} />
                  <input 
                    type="text" 
                    className="glass-input" 
                    style={{ paddingLeft: '38px' }}
                    value={formData.phone} 
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-secondary))' }} />
                  <input 
                    type="email" 
                    className="glass-input" 
                    style={{ paddingLeft: '38px' }}
                    value={formData.email} 
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                    required 
                  />
                </div>
              </div>
            </div>

            <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? (
                  <><span className="spinner spinner-sm"></span> Saving...</>
                ) : (
                  <><Save size={16} /> Save School Configuration</>
                )}
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
};

export default SchoolSettings;
