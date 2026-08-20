import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, Users, BookOpen, Layers, Settings, UserCheck, 
  FileCheck2, BarChart3, Sparkles, Building2, ClipboardList, AlertCircle, 
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../context/SchoolContext';

const Dashboard = () => {
  const { user } = useAuth();
  const { school } = useSchool();
  const navigate = useNavigate();

  const getRoleName = (role) => {
    switch (role) {
      case 'admin': return 'Super Administrator';
      case 'teacher': return 'Subject Teacher';
      case 'exam_officer': return 'Exam Officer';
      case 'bursar': return 'Bursar';
      case 'form_master': return 'Form Master';
      default: return 'User';
    }
  };

  const adminMenuItems = [
    {
      title: 'School Configuration',
      description: 'Manage school details, logo branding, grading scale, and score limits.',
      path: '/admin/settings',
      icon: Settings
    },
    {
      title: 'Staff Management',
      description: 'Create accounts and assign classes and subjects to teachers.',
      path: '/admin/users',
      icon: Users
    },
    {
      title: 'Classes & Arms',
      description: 'Structure grades, class arms, and assign Form Masters.',
      path: '/admin/classes',
      icon: Layers
    },
    {
      title: 'Subject Curriculum',
      description: 'Define course offerings, subject codes, and academic categories.',
      path: '/admin/subjects',
      icon: BookOpen
    },
    {
      title: 'Student Directory',
      description: 'Register student profiles and manage class enrollments.',
      path: '/admin/students',
      icon: GraduationCap
    },
  ];

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto' }} className="animate-fade-in">
      
      {/* Main Hero Banner */}
      <section style={{ marginBottom: '28px' }}>
        <div className="glass-panel" style={{ padding: '24px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '800', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              Welcome back, {user?.name ? user.name.split(' ')[0] : 'User'}! <Sparkles size={24} color="#7b93ff" />
            </h1>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '14px' }}>
              Here is your administrative overview and quick access operations for <strong>{school?.name || 'EduTrack System'}</strong>.
            </p>
          </div>

          {school?.logo_url && (
            <div style={{ padding: '8px 16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-dark)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img 
                src={school.logo_url} 
                alt={school.name} 
                style={{ height: '42px', objectFit: 'contain' }}
              />
              <div style={{ textTransform: 'uppercase', fontSize: '11px', fontWeight: '700', letterSpacing: '1px', color: '#7b93ff' }}>
                Official Emblem
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Super Admin Dashboard View */}
      {user?.role === 'admin' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Stat Cards Overview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            
            <div className="glass-panel stat-card">
              <p className="stat-label">Registered Staff</p>
              <h3 className="stat-value">14</h3>
              <UserCheck className="stat-bg-icon" size={90} color="#7b93ff" />
              <div className="stat-bar" style={{ background: 'hsl(var(--primary))' }}></div>
            </div>

            <div className="glass-panel stat-card">
              <p className="stat-label">Active Classes</p>
              <h3 className="stat-value">8</h3>
              <Layers className="stat-bg-icon" size={90} color="#00f2fe" />
              <div className="stat-bar" style={{ background: 'hsl(var(--accent))' }}></div>
            </div>

            <div className="glass-panel stat-card">
              <p className="stat-label">Total Enrolled Students</p>
              <h3 className="stat-value">342</h3>
              <GraduationCap className="stat-bg-icon" size={90} color="#ff7be1" />
              <div className="stat-bar" style={{ background: 'hsl(var(--secondary))' }}></div>
            </div>

          </div>

          {/* School Profile Information */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <Building2 size={20} color="#7b93ff" />
              <h2 style={{ fontSize: '18px', fontWeight: '700' }}>School Profile & Configuration</h2>
            </div>
            <p style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>{school?.name || 'School profile loading...'}</p>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '13px', lineHeight: '1.6' }}>
              {school?.address || 'Address not configured yet.'}
              <br />
              {school?.phone ? `Phone: ${school.phone}` : ''}
              {school?.email ? ` | Email: ${school.email}` : ''}
            </p>
          </div>

          {/* Module Quick Actions */}
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: 'hsl(var(--text-secondary))' }}>
              System Management Modules
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              {adminMenuItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={item.path}
                    className="glass-panel nav-card"
                    onClick={() => navigate(item.path)}
                    style={{ cursor: 'pointer' }}
                  >
                    <IconComponent className="nav-card-icon" size={80} color="#7b93ff" />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(92, 124, 250, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IconComponent size={20} color="#7b93ff" />
                      </div>
                      <ChevronRight size={18} color="hsl(var(--text-secondary))" />
                    </div>
                    <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>{item.title}</h4>
                    <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', lineHeight: '1.4' }}>{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* Teacher / Form Master Dashboard View */}
      {(user?.role === 'teacher' || user?.role === 'form_master') && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            
            <div className="glass-panel stat-card">
              <p className="stat-label">Assigned Classes</p>
              <h3 className="stat-value">3</h3>
              <Layers className="stat-bg-icon" size={90} color="#ff7be1" />
              <div className="stat-bar" style={{ background: 'hsl(var(--secondary))' }}></div>
            </div>

            <div className="glass-panel stat-card">
              <p className="stat-label">Active Subjects</p>
              <h3 className="stat-value">5</h3>
              <BookOpen className="stat-bg-icon" size={90} color="#7b93ff" />
              <div className="stat-bar" style={{ background: 'hsl(var(--primary))' }}></div>
            </div>

            <div className="glass-panel stat-card">
              <p className="stat-label">Results Progress</p>
              <h3 className="stat-value">112 / 140</h3>
              <ClipboardList className="stat-bg-icon" size={90} color="#00f2fe" />
              <div className="stat-bar" style={{ background: 'hsl(var(--accent))' }}></div>
            </div>

          </div>

          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: 'hsl(var(--text-secondary))' }}>Teacher Operations</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div className="glass-panel nav-card" onClick={() => navigate('/teacher/results-entry')} style={{ cursor: 'pointer' }}>
              <ClipboardList className="nav-card-icon" size={80} color="#ff7be1" />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(235, 92, 180, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ClipboardList size={20} color="#ff7be1" />
                </div>
                <ChevronRight size={18} color="hsl(var(--text-secondary))" />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>Gradebook (Input Results)</h4>
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', lineHeight: '1.4' }}>Enter CA scores and exam marks, calculate totals, and submit them for review.</p>
            </div>

            <div className="glass-panel nav-card" onClick={() => navigate('/teacher/my-subjects')} style={{ cursor: 'pointer' }}>
              <BookOpen className="nav-card-icon" size={80} color="#ff7be1" />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(235, 92, 180, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpen size={20} color="#ff7be1" />
                </div>
                <ChevronRight size={18} color="hsl(var(--text-secondary))" />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>My Assigned Subjects</h4>
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', lineHeight: '1.4' }}>View student rosters and course details for your assigned classes.</p>
            </div>
          </div>
        </div>
      )}

      {/* Exam Officer Dashboard View */}
      {user?.role === 'exam_officer' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            
            <div className="glass-panel stat-card">
              <p className="stat-label">Pending Approvals</p>
              <h3 className="stat-value" style={{ color: '#fffa7b' }}>28</h3>
              <FileCheck2 className="stat-bg-icon" size={90} color="#fffa7b" />
              <div className="stat-bar" style={{ background: '#fffa7b' }}></div>
            </div>

            <div className="glass-panel stat-card">
              <p className="stat-label">Approved Results (Term)</p>
              <h3 className="stat-value">384</h3>
              <BarChart3 className="stat-bg-icon" size={90} color="#00f2fe" />
              <div className="stat-bar" style={{ background: 'hsl(var(--primary))' }}></div>
            </div>

            <div className="glass-panel stat-card">
              <p className="stat-label">Discrepancies</p>
              <h3 className="stat-value" style={{ color: '#ff4b4b' }}>3</h3>
              <AlertCircle className="stat-bg-icon" size={90} color="#ff4b4b" />
              <div className="stat-bar" style={{ background: '#ff4b4b' }}></div>
            </div>

          </div>

          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: 'hsl(var(--text-secondary))' }}>Exam Office Operations</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            
            <div className="glass-panel nav-card" onClick={() => navigate('/exam-officer/approvals')} style={{ cursor: 'pointer' }}>
              <FileCheck2 className="nav-card-icon" size={80} color="#00f2fe" />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(0, 242, 254, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileCheck2 size={20} color="#00f2fe" />
                </div>
                <ChevronRight size={18} color="hsl(var(--text-secondary))" />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>Approve Pending Results</h4>
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', lineHeight: '1.4' }}>Review student grades submitted by teachers, verify parameters, and mark them approved.</p>
            </div>

            <div className="glass-panel nav-card" onClick={() => navigate('/exam-officer/reports')} style={{ cursor: 'pointer' }}>
              <BarChart3 className="nav-card-icon" size={80} color="#00f2fe" />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(0, 242, 254, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChart3 size={20} color="#00f2fe" />
                </div>
                <ChevronRight size={18} color="hsl(var(--text-secondary))" />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>Academic Class Reports</h4>
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', lineHeight: '1.4' }}>Generate, print, and export terminal report cards and broadsheet summary reports.</p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
