import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, Users, BookOpen, Layers, Settings, UserCheck, 
  FileCheck2, BarChart3, Sparkles, Building2, ClipboardList, AlertCircle, 
  ChevronRight, AlertTriangle, Pencil, ArrowRight
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../context/SchoolContext';
import analyticsService from '../services/analyticsService';
import resultService from '../services/resultService';
import formMasterService from '../services/formMasterService';

const CHART_COLORS = ['#7b93ff', '#ff7be1', '#00f2fe', '#ffb400', '#00e676', '#ff4b4b', '#a78bfa', '#f472b6'];

const Dashboard = () => {
  const { user } = useAuth();
  const { school } = useSchool();
  const navigate = useNavigate();

  const [enrollmentData, setEnrollmentData] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [rejectedResults, setRejectedResults] = useState([]);
  
  // Contextual Form Master assigned class state
  const [formMasterClass, setFormMasterClass] = useState(null);

  useEffect(() => {
    // Fetch enrollment analytics for Admin and Exam Officer
    const fetchAnalytics = async () => {
      if (user?.role === 'admin' || user?.role === 'exam_officer') {
        try {
          setAnalyticsLoading(true);
          const data = await analyticsService.getEnrollmentByClass();
          setEnrollmentData(data || []);
        } catch (err) {
          console.error('Failed to fetch analytics:', err);
        } finally {
          setAnalyticsLoading(false);
        }
      }
    };

    // Fetch rejection alerts for Subject Teacher and Form Master
    const fetchTeacherAlerts = async () => {
      if (user?.role === 'teacher' || user?.role === 'form_master') {
        try {
          const res = await resultService.getRejectedResults();
          setRejectedResults(Array.isArray(res) ? res : []);
        } catch (err) {
          console.error('Failed to fetch teacher alerts:', err);
        }
      }
    };

    // Automatically load assigned class for authenticated Form Master session
    const fetchFormMasterClass = async () => {
      if (user?.role === 'form_master') {
        try {
          const classData = await formMasterService.getAssignedClass();
          setFormMasterClass(classData);
        } catch (err) {
          console.error('Failed to load Form Master assigned class:', err);
        }
      }
    };
    
    fetchAnalytics();
    fetchTeacherAlerts();
    fetchFormMasterClass();
  }, [user]);

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
      description: 'Define subjects, codes, and subject weightings.',
      path: '/admin/subjects',
      icon: BookOpen
    },
    {
      title: 'Student Directory',
      description: 'Manage student profiles, admission numbers, and class enrollments.',
      path: '/admin/students',
      icon: GraduationCap
    },
    {
      title: 'Subject Allocations',
      description: 'Assign subjects and class arms to teaching staff.',
      path: '/admin/subject-assignments',
      icon: UserCheck
    },
    {
      title: '1-Click Class Promotion',
      description: 'Promote students to higher class arms based on annual performance.',
      path: '/admin/class-promotion',
      icon: Sparkles
    },
    {
      title: 'Bulk Excel Uploads',
      description: 'Import student profiles and historical grades via standardized Excel files.',
      path: '/admin/bulk-upload',
      icon: FileCheck2
    }
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }} className="animate-fade-in">
      
      {/* Dashboard Header Banner */}
      <div className="glass-panel" style={{ padding: '32px', marginBottom: '32px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {school?.logo_url ? (
              <img 
                src={school.logo_url} 
                alt={school.name} 
                style={{ width: '64px', height: '64px', borderRadius: '16px', objectFit: 'cover', border: '2px solid var(--border-dark)' }} 
              />
            ) : (
              <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px hsla(var(--primary), 0.3)' }}>
                <Building2 size={32} color="#fff" />
              </div>
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                <h1 style={{ fontSize: '26px', fontWeight: '800', tracking: '-0.5px' }}>Welcome back, {user?.name}</h1>
                <span className={`badge badge-${user?.role}`}>{getRoleName(user?.role)}</span>
              </div>
              <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '14px' }}>
                {school?.name || 'School Management System'} • Session {school?.active_session || '2025/2026'} ({school?.active_term || '1st Term'})
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rejection alert banner for subject teachers */}
      {rejectedResults.length > 0 && (user?.role === 'teacher' || user?.role === 'form_master') && (
        <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px', border: '1px solid #ff4b4b', background: 'rgba(255, 75, 75, 0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <AlertTriangle color="#ff4b4b" size={24} />
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#ff4b4b' }}>
                Action Required: Score Submissions Flagged for Correction ({rejectedResults.length})
              </h3>
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))' }}>
                The Exam Officer or Form Master has rejected score entry submission(s). Review comments below and resubmit.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {rejectedResults.map(res => (
              <div key={res.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(255, 75, 75, 0.2)' }}>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '15px', color: 'hsl(var(--text-primary))' }}>
                    Student: {res.student?.name || `${res.student?.first_name || ''} ${res.student?.last_name || ''}`} ({res.student?.admission_number})
                  </div>
                  <div style={{ fontSize: '13px', color: '#ff7be1', marginTop: '2px', fontWeight: '600' }}>
                    Subject: {res.subject?.name} | Class: {res.school_class?.name || res.student?.class?.name} {res.school_class?.arm || res.student?.class?.arm}
                  </div>
                  <div style={{ fontSize: '13px', color: '#ff4b4b', marginTop: '6px', fontWeight: '500' }}>
                    <strong>Reason for Rejection:</strong> "{res.rejection_reason || 'Scores require verification and re-assessment.'}"
                  </div>
                </div>
                <button 
                  onClick={() => navigate('/teacher/results-entry')} 
                  className="btn-primary"
                  style={{ background: '#ff4b4b', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Pencil size={14} /> Edit / Re-upload Scores <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin Dashboard View */}
      {user?.role === 'admin' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <div className="glass-panel stat-card">
              <p className="stat-label">Total Enrolled Students</p>
              <h3 className="stat-value">342</h3>
              <GraduationCap className="stat-bg-icon" size={90} color="#7b93ff" />
              <div className="stat-bar" style={{ background: 'hsl(var(--primary))' }}></div>
            </div>

            <div className="glass-panel stat-card">
              <p className="stat-label">Staff & Teachers</p>
              <h3 className="stat-value">28</h3>
              <Users className="stat-bg-icon" size={90} color="#ff7be1" />
              <div className="stat-bar" style={{ background: 'hsl(var(--secondary))' }}></div>
            </div>

            <div className="glass-panel stat-card">
              <p className="stat-label">Curriculum Subjects</p>
              <h3 className="stat-value">16</h3>
              <BookOpen className="stat-bg-icon" size={90} color="#00f2fe" />
              <div className="stat-bar" style={{ background: 'hsl(var(--accent))' }}></div>
            </div>

            <div className="glass-panel stat-card">
              <p className="stat-label">Active Class Arms</p>
              <h3 className="stat-value">12</h3>
              <Layers className="stat-bg-icon" size={90} color="#fffa7b" />
              <div className="stat-bar" style={{ background: '#fffa7b' }}></div>
            </div>
          </div>

          {/* Enrollment Analytics Chart */}
          <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <BarChart3 size={20} color="#7b93ff" />
              <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Students Enrolled by Class Arm</h2>
            </div>
            {analyticsLoading ? (
              <div className="page-loading"><span className="spinner"></span><p>Loading analytics...</p></div>
            ) : enrollmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={enrollmentData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="class_name" tick={{ fill: 'hsl(var(--text-secondary))', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'hsl(var(--text-secondary))', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ background: 'hsl(var(--card-bg))', border: '1px solid var(--border-dark)', borderRadius: '10px', color: 'hsl(var(--text-primary))' }}
                    cursor={{ fill: 'rgba(92, 124, 250, 0.08)' }}
                  />
                  <Bar dataKey="student_count" name="Enrolled Students" radius={[6, 6, 0, 0]}>
                    {enrollmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '14px', textAlign: 'center', padding: '40px 0' }}>
                No enrollment data available yet.
              </p>
            )}
          </div>

          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: 'hsl(var(--text-secondary))' }}>Administrative Operations</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
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
      )}

      {/* Subject Teacher Dashboard View */}
      {user?.role === 'teacher' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
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
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', lineHeight: '1.4' }}>Enter CA scores and exam marks for your assigned subjects.</p>
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
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', lineHeight: '1.4' }}>View student rosters and course details.</p>
            </div>
          </div>
        </div>
      )}

      {/* Form Master Dashboard View with fully functional buttons & dynamic class context */}
      {user?.role === 'form_master' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <div className="glass-panel stat-card">
              <p className="stat-label">Assigned Form Class</p>
              <h3 className="stat-value" style={{ fontSize: formMasterClass ? '22px' : '26px' }}>
                {formMasterClass ? `${formMasterClass.name} ${formMasterClass.arm}` : 'Assigned Class'}
              </h3>
              <Layers className="stat-bg-icon" size={90} color="#ff7be1" />
              <div className="stat-bar" style={{ background: 'hsl(var(--secondary))' }}></div>
            </div>
            <div className="glass-panel stat-card">
              <p className="stat-label">Class Roster Size</p>
              <h3 className="stat-value">
                {formMasterClass?.students ? formMasterClass.students.length : '45'} Students
              </h3>
              <Users className="stat-bg-icon" size={90} color="#7b93ff" />
              <div className="stat-bar" style={{ background: 'hsl(var(--primary))' }}></div>
            </div>
          </div>

          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: 'hsl(var(--text-secondary))' }}>Form Master Operations</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            
            {/* 1. Assigned Class Roster navigation button */}
            <div 
              className="glass-panel nav-card" 
              onClick={() => navigate('/form-master/roster')} 
              style={{ cursor: 'pointer' }}
            >
              <Users className="nav-card-icon" size={80} color="#7b93ff" />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(92, 124, 250, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={20} color="#7b93ff" />
                </div>
                <ChevronRight size={18} color="hsl(var(--text-secondary))" />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>Assigned Class Roster</h4>
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', lineHeight: '1.4' }}>View student profiles in your assigned form class.</p>
            </div>

            {/* 2. Class Attendance navigation button */}
            <div 
              className="glass-panel nav-card" 
              onClick={() => navigate('/form-master/attendance')} 
              style={{ cursor: 'pointer' }}
            >
              <Layers className="nav-card-icon" size={80} color="#ff7be1" />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(235, 92, 180, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Layers size={20} color="#ff7be1" />
                </div>
                <ChevronRight size={18} color="hsl(var(--text-secondary))" />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>Class Attendance</h4>
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', lineHeight: '1.4' }}>Mark daily attendance registers for your assigned class.</p>
            </div>

            {/* 3. Class Results navigation button */}
            <div 
              className="glass-panel nav-card" 
              onClick={() => navigate('/form-master/results')} 
              style={{ cursor: 'pointer' }}
            >
              <ClipboardList className="nav-card-icon" size={80} color="#00f2fe" />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(0, 242, 254, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ClipboardList size={20} color="#00f2fe" />
                </div>
                <ChevronRight size={18} color="hsl(var(--text-secondary))" />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>Class Results</h4>
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', lineHeight: '1.4' }}>Review overall performance, approve/reject scores, and endorse remarks.</p>
            </div>
          </div>
        </div>
      )}

      {/* Bursar Dashboard View */}
      {user?.role === 'bursar' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            <div className="glass-panel stat-card">
              <p className="stat-label">Total Collections</p>
              <h3 className="stat-value" style={{ color: '#00f2fe' }}>₦2.4M</h3>
              <BarChart3 className="stat-bg-icon" size={90} color="#00f2fe" />
              <div className="stat-bar" style={{ background: 'hsl(var(--primary))' }}></div>
            </div>
            <div className="glass-panel stat-card">
              <p className="stat-label">Pending Debts</p>
              <h3 className="stat-value" style={{ color: '#ff4b4b' }}>42</h3>
              <AlertCircle className="stat-bg-icon" size={90} color="#ff4b4b" />
              <div className="stat-bar" style={{ background: '#ff4b4b' }}></div>
            </div>
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: 'hsl(var(--text-secondary))' }}>Financial Operations</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div className="glass-panel nav-card" onClick={() => navigate('/bursar/fee-payments')} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(0, 242, 254, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChart3 size={20} color="#00f2fe" />
                </div>
                <ChevronRight size={18} color="hsl(var(--text-secondary))" />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>Fee Collection & Clearance</h4>
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', lineHeight: '1.4' }}>Track student fee payments, calculate balances, and manage financial clearance.</p>
            </div>
          </div>
        </div>
      )}

      {/* Exam Officer Dashboard View */}
      {user?.role === 'exam_officer' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
            
            <div className="glass-panel stat-card">
              <p className="stat-label">Overall Performance</p>
              <h3 className="stat-value" style={{ color: '#fffa7b' }}>74%</h3>
              <Sparkles className="stat-bg-icon" size={90} color="#fffa7b" />
              <div className="stat-bar" style={{ background: '#fffa7b' }}></div>
            </div>

            <div className="glass-panel stat-card">
              <p className="stat-label">Pending Result Approvals</p>
              <h3 className="stat-value">28</h3>
              <FileCheck2 className="stat-bg-icon" size={90} color="#00f2fe" />
              <div className="stat-bar" style={{ background: 'hsl(var(--primary))' }}></div>
            </div>

          </div>

          {/* Enrollment Analytics Chart */}
          <div className="glass-panel" style={{ padding: '24px', marginBottom: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <BarChart3 size={20} color="#00f2fe" />
              <h2 style={{ fontSize: '18px', fontWeight: '700' }}>Students Enrolled by Class</h2>
            </div>
            {analyticsLoading ? (
              <div className="page-loading"><span className="spinner"></span><p>Loading analytics...</p></div>
            ) : enrollmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={enrollmentData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="class_name" tick={{ fill: 'hsl(var(--text-secondary))', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'hsl(var(--text-secondary))', fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ background: 'hsl(var(--card-bg))', border: '1px solid var(--border-dark)', borderRadius: '10px', color: 'hsl(var(--text-primary))' }}
                    cursor={{ fill: 'rgba(92, 124, 250, 0.08)' }}
                  />
                  <Bar dataKey="student_count" name="Enrolled Students" radius={[6, 6, 0, 0]}>
                    {enrollmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '14px', textAlign: 'center', padding: '40px 0' }}>
                No enrollment data available yet.
              </p>
            )}
          </div>

          <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px', color: 'hsl(var(--text-secondary))' }}>Exam Office Operations</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            
            <div className="glass-panel nav-card" onClick={() => navigate('/exam-officer/broadsheet')} style={{ cursor: 'pointer' }}>
              <UserCheck className="nav-card-icon" size={80} color="#7b93ff" />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(92, 124, 250, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserCheck size={20} color="#7b93ff" />
                </div>
                <ChevronRight size={18} color="hsl(var(--text-secondary))" />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>1-Click Broadsheets & Report Cards</h4>
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', lineHeight: '1.4' }}>Generate print-ready broadsheets, report cards, and verify score authenticity.</p>
            </div>

            <div className="glass-panel nav-card" onClick={() => navigate('/exam-officer/reports')} style={{ cursor: 'pointer' }}>
              <BarChart3 className="nav-card-icon" size={80} color="#00f2fe" />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(0, 242, 254, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChart3 size={20} color="#00f2fe" />
                </div>
                <ChevronRight size={18} color="hsl(var(--text-secondary))" />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>Class Performance Analytics</h4>
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', lineHeight: '1.4' }}>Analyze terminal grade distribution across all subjects and class arms.</p>
            </div>

            <div className="glass-panel nav-card" onClick={() => navigate('/exam-officer/approvals')} style={{ cursor: 'pointer' }}>
              <FileCheck2 className="nav-card-icon" size={80} color="#ff7be1" />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(235, 92, 180, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileCheck2 size={20} color="#ff7be1" />
                </div>
                <ChevronRight size={18} color="hsl(var(--text-secondary))" />
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>Approve Pending Results</h4>
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', lineHeight: '1.4' }}>Review student grades submitted by teachers for final approval.</p>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
