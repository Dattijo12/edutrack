import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const getRoleName = (role) => {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'teacher': return 'Teacher';
      case 'exam_officer': return 'Exam Officer';
      default: return 'User';
    }
  };

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'admin': return { background: 'rgba(92, 124, 250, 0.15)', color: '#7b93ff', border: '1px solid rgba(92, 124, 250, 0.3)' };
      case 'teacher': return { background: 'rgba(235, 92, 180, 0.15)', color: '#ff7be1', border: '1px solid rgba(235, 92, 180, 0.3)' };
      case 'exam_officer': return { background: 'rgba(0, 242, 254, 0.12)', color: '#00f2fe', border: '1px solid rgba(0, 242, 254, 0.25)' };
      default: return {};
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }} className="animate-fade-in">
      
      {/* Navigation Header */}
      <header className="glass-panel" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 30px',
        marginBottom: '40px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h2 style={{
            fontSize: '22px',
            fontWeight: '700',
            background: 'linear-gradient(135deg, #fff 0%, hsl(var(--text-secondary)) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            EduTrack Portal
          </h2>
          <span style={{
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            ...getRoleBadgeStyle(user?.role)
          }}>
            {getRoleName(user?.role)}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: '14px', fontWeight: '600', color: 'hsl(var(--text-primary))' }}>{user?.name}</p>
            <p style={{ fontSize: '11px', color: 'hsl(var(--text-secondary))' }}>{user?.email}</p>
          </div>
          <button onClick={logout} className="btn-logout">
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Hero Summary */}
      <section style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
          Welcome back, {user?.name.split(' ')[0]}!
        </h1>
        <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '15px' }}>
          Here is a quick summary of what is happening in the system today.
        </p>
      </section>

      {/* Role-Specific Metric Cards & Quick Links */}
      {user?.role === 'admin' && (
        <div>
          {/* Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            <div className="glass-panel" style={{ padding: '25px', position: 'relative', overflow: 'hidden' }}>
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>Active Teachers</p>
              <h3 style={{ fontSize: '32px', fontWeight: '800' }}>14</h3>
              <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', height: '4px', background: 'hsl(var(--primary))' }}></div>
            </div>
            <div className="glass-panel" style={{ padding: '25px', position: 'relative', overflow: 'hidden' }}>
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>Active Classes</p>
              <h3 style={{ fontSize: '32px', fontWeight: '800' }}>8</h3>
              <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', height: '4px', background: 'hsl(var(--accent))' }}></div>
            </div>
            <div className="glass-panel" style={{ padding: '25px', position: 'relative', overflow: 'hidden' }}>
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>Total Registered Students</p>
              <h3 style={{ fontSize: '32px', fontWeight: '800' }}>342</h3>
              <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', height: '4px', background: 'hsl(var(--secondary))' }}></div>
            </div>
          </div>

          {/* Quick Actions */}
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px', color: 'hsl(var(--text-secondary))' }}>Administrative Tasks</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            <div className="glass-panel" onClick={() => navigate('/admin/classes')} style={{ padding: '25px', cursor: 'pointer', transition: 'transform 0.2s' }}
                 onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                 onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px', color: '#7b93ff' }}>Manage Classes</h4>
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', lineHeight: '1.4' }}>Define school grades, levels, and classrooms.</p>
            </div>
            <div className="glass-panel" onClick={() => navigate('/admin/subjects')} style={{ padding: '25px', cursor: 'pointer', transition: 'transform 0.2s' }}
                 onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                 onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px', color: '#7b93ff' }}>Manage Subjects</h4>
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', lineHeight: '1.4' }}>Define curriculum courses and codes.</p>
            </div>
            <div className="glass-panel" onClick={() => navigate('/admin/students')} style={{ padding: '25px', cursor: 'pointer', transition: 'transform 0.2s' }}
                 onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                 onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px', color: '#7b93ff' }}>Manage Students</h4>
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', lineHeight: '1.4' }}>Register new student profiles and enroll them in classes.</p>
            </div>
          </div>
        </div>
      )}

      {user?.role === 'teacher' && (
        <div>
          {/* Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            <div className="glass-panel" style={{ padding: '25px', position: 'relative', overflow: 'hidden' }}>
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>My Assigned Classes</p>
              <h3 style={{ fontSize: '32px', fontWeight: '800' }}>3</h3>
              <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', height: '4px', background: 'hsl(var(--secondary))' }}></div>
            </div>
            <div className="glass-panel" style={{ padding: '25px', position: 'relative', overflow: 'hidden' }}>
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>My Active Subjects</p>
              <h3 style={{ fontSize: '32px', fontWeight: '800' }}>5</h3>
              <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', height: '4px', background: 'hsl(var(--primary))' }}></div>
            </div>
            <div className="glass-panel" style={{ padding: '25px', position: 'relative', overflow: 'hidden' }}>
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>Results Inputted</p>
              <h3 style={{ fontSize: '32px', fontWeight: '800' }}>112 / 140</h3>
              <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', height: '4px', background: 'hsl(var(--accent))' }}></div>
            </div>
          </div>

          {/* Quick Actions */}
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px', color: 'hsl(var(--text-secondary))' }}>Teacher Operations</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div className="glass-panel" onClick={() => navigate('/teacher/results-entry')} style={{ padding: '25px', cursor: 'pointer', transition: 'transform 0.2s' }}
                 onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                 onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px', color: '#ff7be1' }}>Gradebook (Input Results)</h4>
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', lineHeight: '1.4' }}>Enter CA scores and exam marks, calculate totals, and submit them for review.</p>
            </div>
            <div className="glass-panel" onClick={() => navigate('/teacher/my-subjects')} style={{ padding: '25px', cursor: 'pointer', transition: 'transform 0.2s' }}
                 onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                 onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px', color: '#ff7be1' }}>My Subjects</h4>
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', lineHeight: '1.4' }}>View student rolls and course outlines for your assigned classes.</p>
            </div>
          </div>
        </div>
      )}

      {user?.role === 'exam_officer' && (
        <div>
          {/* Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            <div className="glass-panel" style={{ padding: '25px', position: 'relative', overflow: 'hidden' }}>
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>Pending Approvals</p>
              <h3 style={{ fontSize: '32px', fontWeight: '800', color: '#fffa7b' }}>28</h3>
              <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', height: '4px', background: '#fffa7b' }}></div>
            </div>
            <div className="glass-panel" style={{ padding: '25px', position: 'relative', overflow: 'hidden' }}>
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>Approved Results (Term)</p>
              <h3 style={{ fontSize: '32px', fontWeight: '800' }}>384</h3>
              <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', height: '4px', background: 'hsl(var(--primary))' }}></div>
            </div>
            <div className="glass-panel" style={{ padding: '25px', position: 'relative', overflow: 'hidden' }}>
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>Rejections / Discrepancies</p>
              <h3 style={{ fontSize: '32px', fontWeight: '800' }}>3</h3>
              <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', height: '4px', background: '#ff4b4b' }}></div>
            </div>
          </div>

          {/* Quick Actions */}
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '15px', color: 'hsl(var(--text-secondary))' }}>Exam Office Operations</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div className="glass-panel" onClick={() => navigate('/exam-officer/approvals')} style={{ padding: '25px', cursor: 'pointer', transition: 'transform 0.2s' }}
                 onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                 onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px', color: '#00f2fe' }}>Approve Pending Results</h4>
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', lineHeight: '1.4' }}>Review student grades submitted by teachers, verify parameters, and mark them approved.</p>
            </div>
            <div className="glass-panel" onClick={() => navigate('/exam-officer/reports')} style={{ padding: '25px', cursor: 'pointer', transition: 'transform 0.2s' }}
                 onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
                 onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px', color: '#00f2fe' }}>Academic Class Reports</h4>
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', lineHeight: '1.4' }}>Generate, print, and export terminal report cards and sheet summary reports for classes.</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
