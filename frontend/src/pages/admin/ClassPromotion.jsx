import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';
import classService from '../../services/classService';

const ClassPromotion = () => {
  const [classes, setClasses] = useState([]);
  const [fromClassId, setFromClassId] = useState('');
  const [toClassId, setToClassId] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    classService.getAll().then(setClasses).catch(console.error);
  }, []);

  const handlePromote = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!fromClassId || !toClassId) {
      setError('Please select both current class and target promotion class.');
      return;
    }

    if (fromClassId === toClassId) {
      setError('Target promotion class must be different from current class.');
      return;
    }

    if (!window.confirm('Are you sure you want to promote ALL eligible students from the current class to the target class in 1-click?')) {
      return;
    }

    setLoading(true);

    try {
      const res = await adminService.promoteClass({
        from_class_id: fromClassId,
        to_class_id: toClassId,
      });
      setMessage(`🎉 ${res.message}`);
      setFromClassId('');
      setToClassId('');
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || 'Class promotion failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '700px', margin: '0 auto' }} className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '40px' }}>
        <Link to="/dashboard" style={{ color: '#00f2fe', textDecoration: 'none', fontSize: '14px', marginBottom: '15px', display: 'inline-block' }}>
          &larr; Back to Dashboard
        </Link>
        
        <h2 style={{ fontSize: '26px', fontWeight: '700', marginBottom: '8px' }}>1-Click Automated Class Promotion</h2>
        <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '14px', marginBottom: '30px' }}>
          Promote all students in a class to the next academic level at 3rd term end.
        </p>

        {message && (
          <div style={{ padding: '14px 18px', borderRadius: '8px', background: 'rgba(75,255,125,0.15)', color: '#4bff7d', fontSize: '14px', marginBottom: '20px', fontWeight: '600' }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{ padding: '14px 18px', borderRadius: '8px', background: 'rgba(255,75,75,0.15)', color: '#ff4b4b', fontSize: '14px', marginBottom: '20px', fontWeight: '600' }}>
            ❌ {error}
          </div>
        )}

        <form onSubmit={handlePromote} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Promote Students FROM (Current Class)
            </label>
            <select className="glass-input" value={fromClassId} onChange={(e) => setFromClassId(e.target.value)} required>
              <option value="" style={{ color: '#000' }}>-- Choose Current Class --</option>
              {classes.map(c => (
                <option key={c.id} value={c.id} style={{ color: '#000' }}>{c.name} {c.arm}</option>
              ))}
            </select>
          </div>

          <div style={{ textAlign: 'center', fontSize: '24px', color: '#00f2fe' }}>
            ⬇️
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Promote Students TO (Target Next Level)
            </label>
            <select className="glass-input" value={toClassId} onChange={(e) => setToClassId(e.target.value)} required>
              <option value="" style={{ color: '#000' }}>-- Choose Target Class --</option>
              {classes.map(c => (
                <option key={c.id} value={c.id} style={{ color: '#000' }}>{c.name} {c.arm}</option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: '15px' }}>
            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', padding: '14px' }}>
              {loading ? 'Promoting Students...' : '⚡ Promote Entire Class Now'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default ClassPromotion;
