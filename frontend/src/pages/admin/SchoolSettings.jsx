import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';

const SchoolSettings = () => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    max_ca_score: 30,
    max_exam_score: 70,
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    const ca = parseFloat(formData.max_ca_score);
    const exam = parseFloat(formData.max_exam_score);

    if (ca + exam !== 100) {
      setError(`CA Score (${ca}) + Exam Score (${exam}) must equal exactly 100%! Current total: ${ca + exam}%`);
      return;
    }

    try {
      await adminService.updateSettings(formData);
      setMessage('✅ School settings and dynamic CA/Exam score bounds updated successfully!');
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to update settings.');
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '800px', margin: '0 auto' }} className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '40px' }}>
        <Link to="/dashboard" style={{ color: '#00f2fe', textDecoration: 'none', fontSize: '14px', marginBottom: '15px', display: 'inline-block' }}>
          &larr; Back to Dashboard
        </Link>

        <h2 style={{ fontSize: '26px', fontWeight: '700', marginBottom: '8px' }}>School & Grading Configuration</h2>
        <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '14px', marginBottom: '30px' }}>
          Configure school header information, principal details, and dynamic CA/Exam max score limits.
        </p>

        {message && (
          <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(75,255,125,0.15)', color: '#4bff7d', fontSize: '14px', marginBottom: '20px' }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(255,75,75,0.15)', color: '#ff4b4b', fontSize: '14px', marginBottom: '20px' }}>
            ❌ {error}
          </div>
        )}

        {loading ? (
          <p style={{ color: 'hsl(var(--text-secondary))', textAlign: 'center', padding: '30px' }}>Loading settings...</p>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Dynamic Score Limits Box */}
            <div style={{ padding: '20px', borderRadius: '12px', background: 'rgba(123, 147, 255, 0.08)', border: '1px solid rgba(123, 147, 255, 0.2)' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#7b93ff', marginBottom: '10px' }}>
                ⚙️ Dynamic CA / Exam Max Limits (Score Validation Engine)
              </h3>
              <p style={{ fontSize: '12px', color: 'hsl(var(--text-secondary))', marginBottom: '15px' }}>
                All teacher score entry inputs will strictly validate against these bounds in real-time. (CA + Exam must total 100)
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>
                    Max CA Score (e.g. 30 or 40)
                  </label>
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
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>
                    Max Exam Score (e.g. 70 or 60)
                  </label>
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
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>School Name</label>
              <input type="text" className="glass-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>School Address</label>
              <input type="text" className="glass-input" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} required />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>Phone Number</label>
                <input type="text" className="glass-input" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>Email Address</label>
                <input type="email" className="glass-input" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              </div>
            </div>

            <div style={{ marginTop: '15px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn-primary">
                Save School Configuration
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
};

export default SchoolSettings;
