import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  Settings,
  Save,
  Sliders,
  Building2,
  Phone,
  Mail,
  Upload,
  Image as ImageIcon,
  PenTool,
  Stamp,
  CheckCircle2,
  Sparkles,
  Info
} from 'lucide-react';
import adminService from '../../services/adminService';
import { useSchool } from '../../context/SchoolContext';

/**
 * SchoolSettings Component
 * Administrative control panel for school branding, official signatures,
 * institutional seal, contact information, and dynamic grading thresholds.
 */
const SchoolSettings = () => {
  const { refreshSchool } = useSchool();

  const [formData, setFormData] = useState({
    name: '',
    motto: '',
    address: '',
    phone: '',
    email: '',
    principal_name: '',
    max_ca_score: 30,
    max_exam_score: 70,
    grade_a_min: 75,
    grade_b_min: 65,
    grade_c_min: 50,
    grade_d_min: 40,
    grade_e_min: 35,
  });

  // Asset Files and Previews
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [currentLogoUrl, setCurrentLogoUrl] = useState(null);

  const [signatureFile, setSignatureFile] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);
  const [currentSignatureUrl, setCurrentSignatureUrl] = useState(null);

  const [stampFile, setStampFile] = useState(null);
  const [stampPreview, setStampPreview] = useState(null);
  const [currentStampUrl, setCurrentStampUrl] = useState(null);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    adminService.getSettings()
      .then((data) => {
        setFormData({
          name: data.name || '',
          motto: data.motto || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          principal_name: data.principal_name || '',
          max_ca_score: data.max_ca_score || 30,
          max_exam_score: data.max_exam_score || 70,
          grade_a_min: data.grade_a_min ?? 75,
          grade_b_min: data.grade_b_min ?? 65,
          grade_c_min: data.grade_c_min ?? 50,
          grade_d_min: data.grade_d_min ?? 40,
          grade_e_min: data.grade_e_min ?? 35,
        });

        if (data.logo_url) setCurrentLogoUrl(data.logo_url);
        if (data.principal_signature_url) setCurrentSignatureUrl(data.principal_signature_url);
        if (data.stamp_url || data.school_stamp_url) setCurrentStampUrl(data.stamp_url || data.school_stamp_url);
      })
      .catch((err) => {
        console.error('Failed to fetch settings:', err);
        toast.error('Failed to load school settings.');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleFileChange = (e, setFile, setPreview) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error('Image file size must be less than 2MB.');
        return;
      }
      setFile(file);
      setPreview(URL.createObjectURL(file));
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
      const payload = new FormData();
      payload.append('name', formData.name);
      payload.append('motto', formData.motto);
      payload.append('address', formData.address);
      payload.append('phone', formData.phone);
      payload.append('email', formData.email);
      payload.append('principal_name', formData.principal_name);
      payload.append('max_ca_score', formData.max_ca_score);
      payload.append('max_exam_score', formData.max_exam_score);
      payload.append('grade_a_min', formData.grade_a_min);
      payload.append('grade_b_min', formData.grade_b_min);
      payload.append('grade_c_min', formData.grade_c_min);
      payload.append('grade_d_min', formData.grade_d_min);
      payload.append('grade_e_min', formData.grade_e_min);

      if (logoFile) {
        payload.append('logo', logoFile);
      }
      if (signatureFile) {
        payload.append('principal_signature', signatureFile);
      }
      if (stampFile) {
        payload.append('stamp', stampFile);
      }

      const res = await adminService.updateSettings(payload);
      toast.success('School settings, official branding & signatures saved successfully!');

      if (res?.data?.logo_url) setCurrentLogoUrl(res.data.logo_url);
      if (res?.data?.principal_signature_url) setCurrentSignatureUrl(res.data.principal_signature_url);
      if (res?.data?.stamp_url) setCurrentStampUrl(res.data.stamp_url);

      refreshSchool();
    } catch (err) {
      console.error('Save settings error:', err);
      toast.error(err?.response?.data?.message || 'Failed to update settings.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '920px', margin: '0 auto' }} className="animate-fade-in space-y-6">
      <div className="glass-panel" style={{ padding: '36px' }}>
        
        {/* Module Header */}
        <div style={{ marginBottom: '28px', borderBottom: '1px solid var(--border-dark)', paddingBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(92, 124, 250, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Settings size={22} color="#7b93ff" />
            </div>
            <div>
              <h2 style={{ fontSize: '24px', fontWeight: '800' }}>School Branding & System Configuration</h2>
              <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '13px', marginTop: '2px' }}>
                Manage school identity, official signatures, institutional stamps, score validation rules, and grading scale.
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
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
            
            {/* Section 1: Official Authorization Assets & Branding Cards */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Sparkles size={18} color="#00f2fe" />
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>
                  Official Branding, Signatures & Seal
                </h3>
              </div>
              <p style={{ fontSize: '12px', color: 'hsl(var(--text-secondary))', marginBottom: '16px' }}>
                Assets uploaded here appear automatically across the web portals and on generated terminal report cards.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '18px' }}>
                
                {/* 1. School Logo */}
                <div style={{ padding: '18px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-dark)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <ImageIcon size={16} color="#7b93ff" />
                    <span style={{ fontSize: '14px', fontWeight: '700' }}>School Logo / Crest</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '14px' }}>
                    <div style={{
                      width: '76px',
                      height: '76px',
                      borderRadius: '12px',
                      border: '2px dashed var(--border-dark)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(0,0,0,0.2)',
                      overflow: 'hidden',
                    }}>
                      {logoPreview || currentLogoUrl ? (
                        <img 
                          src={logoPreview || currentLogoUrl} 
                          alt="School Logo" 
                          style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }}
                        />
                      ) : (
                        <Building2 size={28} style={{ opacity: 0.3 }} />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <label 
                        htmlFor="logo-input" 
                        className="btn-secondary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '8px 14px', fontSize: '12px', borderRadius: '8px' }}
                      >
                        <Upload size={14} /> Upload Logo
                      </label>
                      <input 
                        id="logo-input"
                        type="file" 
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        onChange={(e) => handleFileChange(e, setLogoFile, setLogoPreview)}
                        style={{ display: 'none' }}
                      />
                      {logoFile && (
                        <p style={{ fontSize: '11px', color: '#00e676', fontWeight: '600', marginTop: '6px' }}>
                          ✓ {logoFile.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', color: 'hsl(var(--text-secondary))' }}>
                    Recommended: Transparent PNG, square ratio.
                  </span>
                </div>

                {/* 2. Principal Signature */}
                <div style={{ padding: '18px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-dark)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <PenTool size={16} color="#ff7be1" />
                    <span style={{ fontSize: '14px', fontWeight: '700' }}>Principal's Signature</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '14px' }}>
                    <div style={{
                      width: '76px',
                      height: '76px',
                      borderRadius: '12px',
                      border: '2px dashed var(--border-dark)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(0,0,0,0.2)',
                      overflow: 'hidden',
                    }}>
                      {signaturePreview || currentSignatureUrl ? (
                        <img 
                          src={signaturePreview || currentSignatureUrl} 
                          alt="Principal Signature" 
                          style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }}
                        />
                      ) : (
                        <span style={{ fontFamily: 'cursive', fontSize: '13px', fontStyle: 'italic', opacity: 0.5, color: '#ff7be1' }}>
                          Sign
                        </span>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <label 
                        htmlFor="sig-input" 
                        className="btn-secondary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '8px 14px', fontSize: '12px', borderRadius: '8px' }}
                      >
                        <Upload size={14} /> Upload Signature
                      </label>
                      <input 
                        id="sig-input"
                        type="file" 
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        onChange={(e) => handleFileChange(e, setSignatureFile, setSignaturePreview)}
                        style={{ display: 'none' }}
                      />
                      {signatureFile && (
                        <p style={{ fontSize: '11px', color: '#00e676', fontWeight: '600', marginTop: '6px' }}>
                          ✓ {signatureFile.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', color: 'hsl(var(--text-secondary))' }}>
                    If omitted, an elegant cursive name signature is rendered.
                  </span>
                </div>

                {/* 3. Official School Stamp / Seal */}
                <div style={{ padding: '18px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-dark)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <Stamp size={16} color="#00e676" />
                    <span style={{ fontSize: '14px', fontWeight: '700' }}>Official School Seal / Stamp</span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '14px' }}>
                    <div style={{
                      width: '76px',
                      height: '76px',
                      borderRadius: '12px',
                      border: '2px dashed var(--border-dark)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(0,0,0,0.2)',
                      overflow: 'hidden',
                    }}>
                      {stampPreview || currentStampUrl ? (
                        <img 
                          src={stampPreview || currentStampUrl} 
                          alt="School Stamp" 
                          style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }}
                        />
                      ) : (
                        <div style={{ border: '1px dashed #00e676', borderRadius: '50%', width: '46px', height: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold', color: '#00e676', textAlign: 'center', lineHeight: 1.1 }}>
                          SEAL
                        </div>
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <label 
                        htmlFor="stamp-input" 
                        className="btn-secondary"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '8px 14px', fontSize: '12px', borderRadius: '8px' }}
                      >
                        <Upload size={14} /> Upload Stamp
                      </label>
                      <input 
                        id="stamp-input"
                        type="file" 
                        accept="image/png, image/jpeg, image/jpg, image/webp"
                        onChange={(e) => handleFileChange(e, setStampFile, setStampPreview)}
                        style={{ display: 'none' }}
                      />
                      {stampFile && (
                        <p style={{ fontSize: '11px', color: '#00e676', fontWeight: '600', marginTop: '6px' }}>
                          ✓ {stampFile.name}
                        </p>
                      )}
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', color: 'hsl(var(--text-secondary))' }}>
                    Official ink stamp or security watermark seal.
                  </span>
                </div>

              </div>
            </div>

            {/* Section 2: School Profile Metadata */}
            <div style={{ padding: '22px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-dark)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                <Building2 size={18} color="#7b93ff" />
                <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Institutional Profile Information</h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label className="form-label">School Name *</label>
                    <input 
                      type="text" 
                      className="glass-input" 
                      value={formData.name} 
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                      required 
                    />
                  </div>

                  <div>
                    <label className="form-label">School Motto / Slogan</label>
                    <input 
                      type="text" 
                      className="glass-input" 
                      placeholder="e.g. Excellence, Integrity and Discipline"
                      value={formData.motto} 
                      onChange={(e) => setFormData({ ...formData, motto: e.target.value })} 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label className="form-label">Principal / Head of School Full Name</label>
                    <input 
                      type="text" 
                      className="glass-input" 
                      placeholder="e.g. Dr. A. B. Danjuma (Principal)"
                      value={formData.principal_name} 
                      onChange={(e) => setFormData({ ...formData, principal_name: e.target.value })} 
                    />
                  </div>

                  <div>
                    <label className="form-label">School Physical Address *</label>
                    <input 
                      type="text" 
                      className="glass-input" 
                      value={formData.address} 
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })} 
                      required 
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label className="form-label">Official Phone Number *</label>
                    <div style={{ position: 'relative' }}>
                      <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-secondary))' }} />
                      <input 
                        type="text" 
                        className="glass-input" 
                        style={{ paddingLeft: '36px' }}
                        value={formData.phone} 
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                        required 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="form-label">Official Email Address *</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-secondary))' }} />
                      <input 
                        type="email" 
                        className="glass-input" 
                        style={{ paddingLeft: '36px' }}
                        value={formData.email} 
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                        required 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Dynamic Score Limits Box */}
            <div style={{ padding: '22px', borderRadius: '14px', background: 'rgba(123, 147, 255, 0.08)', border: '1px solid rgba(123, 147, 255, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <Sliders size={18} color="#7b93ff" />
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#7b93ff' }}>
                  Dynamic CA / Exam Max Limits (Validation Engine)
                </h3>
              </div>
              <p style={{ fontSize: '12px', color: 'hsl(var(--text-secondary))', marginBottom: '16px', lineHeight: '1.4' }}>
                All teacher score inputs validate against these bounds in real-time. (CA + Exam must total 100%)
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

            {/* Section 4: Grade Boundaries (WAEC / NECO Standards) */}
            <div style={{ padding: '22px', borderRadius: '14px', background: 'rgba(0, 230, 118, 0.05)', border: '1px solid rgba(0, 230, 118, 0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <Sliders size={18} color="#00e676" />
                <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#00e676' }}>
                  Letter Grade Thresholds (WAEC / NECO Standards)
                </h3>
              </div>
              <p style={{ fontSize: '12px', color: 'hsl(var(--text-secondary))', marginBottom: '16px', lineHeight: '1.4' }}>
                Minimum total percentage threshold required for each letter grade on report cards and broadsheets.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '12px' }}>
                <div>
                  <label className="form-label">Grade A (Min %)</label>
                  <input 
                    type="number" 
                    className="glass-input" 
                    min={0} 
                    max={100}
                    value={formData.grade_a_min} 
                    onChange={(e) => setFormData({ ...formData, grade_a_min: e.target.value })} 
                    required 
                  />
                </div>

                <div>
                  <label className="form-label">Grade B (Min %)</label>
                  <input 
                    type="number" 
                    className="glass-input" 
                    min={0} 
                    max={100}
                    value={formData.grade_b_min} 
                    onChange={(e) => setFormData({ ...formData, grade_b_min: e.target.value })} 
                    required 
                  />
                </div>

                <div>
                  <label className="form-label">Grade C (Min %)</label>
                  <input 
                    type="number" 
                    className="glass-input" 
                    min={0} 
                    max={100}
                    value={formData.grade_c_min} 
                    onChange={(e) => setFormData({ ...formData, grade_c_min: e.target.value })} 
                    required 
                  />
                </div>

                <div>
                  <label className="form-label">Grade D (Min %)</label>
                  <input 
                    type="number" 
                    className="glass-input" 
                    min={0} 
                    max={100}
                    value={formData.grade_d_min} 
                    onChange={(e) => setFormData({ ...formData, grade_d_min: e.target.value })} 
                    required 
                  />
                </div>

                <div>
                  <label className="form-label">Grade E (Min %)</label>
                  <input 
                    type="number" 
                    className="glass-input" 
                    min={0} 
                    max={100}
                    value={formData.grade_e_min} 
                    onChange={(e) => setFormData({ ...formData, grade_e_min: e.target.value })} 
                    required 
                  />
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '10px' }}>
              <button type="submit" className="btn-primary" disabled={submitting} style={{ padding: '12px 28px', fontSize: '14px' }}>
                {submitting ? (
                  <><span className="spinner spinner-sm"></span> Saving Branding & Settings...</>
                ) : (
                  <><Save size={18} /> Save Institutional Configuration</>
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
