import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  LayoutDashboard, Settings, Users, Layers, BookOpen, 
  GraduationCap, ClipboardList, FileCheck2, BarChart3, 
  FileSpreadsheet, KeyRound, ShieldCheck, LogOut, Sun, Moon, 
  Bell, Menu, X, Building2, ChevronRight, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useSchool } from '../../context/SchoolContext';

const AppLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { school } = useSchool();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      toast.info('Signed out successfully.');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoggingOut(false);
    }
  };

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

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'admin': return { background: 'rgba(92, 124, 250, 0.15)', color: '#7b93ff', border: '1px solid rgba(92, 124, 250, 0.3)' };
      case 'teacher': return { background: 'rgba(235, 92, 180, 0.15)', color: '#ff7be1', border: '1px solid rgba(235, 92, 180, 0.3)' };
      case 'exam_officer': return { background: 'rgba(0, 242, 254, 0.12)', color: '#00f2fe', border: '1px solid rgba(0, 242, 254, 0.25)' };
      case 'bursar': return { background: 'rgba(255, 180, 0, 0.15)', color: '#ffb400', border: '1px solid rgba(255, 180, 0, 0.3)' };
      case 'form_master': return { background: 'rgba(0, 230, 118, 0.15)', color: '#00e676', border: '1px solid rgba(0, 230, 118, 0.3)' };
      default: return {};
    }
  };

  // Build dynamic navigation items based on user role
  const getNavItems = () => {
    const items = [
      {
        label: 'Dashboard',
        path: '/dashboard',
        icon: LayoutDashboard,
        roles: ['admin', 'teacher', 'exam_officer', 'bursar', 'form_master']
      }
    ];

    if (user?.role === 'admin') {
      items.push(
        { label: 'School Configuration', path: '/admin/settings', icon: Settings },
        { label: 'Staff Management', path: '/admin/users', icon: Users },
        { label: 'Classes & Arms', path: '/admin/classes', icon: Layers },
        { label: 'Subject Curriculum', path: '/admin/subjects', icon: BookOpen },
        { label: 'Student Directory', path: '/admin/students', icon: GraduationCap }
      );
    }

    if (user?.role === 'teacher' || user?.role === 'form_master') {
      items.push(
        { label: 'Gradebook (Input Results)', path: '/teacher/results-entry', icon: ClipboardList },
        { label: 'My Assigned Subjects', path: '/teacher/my-subjects', icon: BookOpen }
      );
    }

    if (user?.role === 'exam_officer') {
      items.push(
        { label: 'Approve Results', path: '/exam-officer/approvals', icon: FileCheck2 },
        { label: 'Class Academic Reports', path: '/exam-officer/reports', icon: BarChart3 },
        { label: 'Broadsheet Summary', path: '/exam-officer/broadsheet', icon: FileSpreadsheet }
      );
    }

    // Shared account links
    items.push(
      { label: 'Change Password', path: '/change-password', icon: KeyRound },
      { label: 'Verify Result', path: '/verify-result', icon: ShieldCheck }
    );

    return items;
  };

  // Generate Page Title based on route
  const getPageTitle = () => {
    const p = location.pathname;
    if (p === '/dashboard') return 'System Dashboard';
    if (p === '/admin/settings') return 'School & Grading Configuration';
    if (p === '/admin/users') return 'Staff Account Management';
    if (p === '/admin/classes') return 'Classes & Arms Management';
    if (p === '/admin/subjects') return 'Subject Curriculum';
    if (p === '/admin/students') return 'Student Directory';
    if (p === '/teacher/results-entry') return 'Gradebook & Score Entry';
    if (p === '/teacher/my-subjects') return 'My Assigned Subjects';
    if (p === '/exam-officer/approvals') return 'Results Approval Center';
    if (p === '/exam-officer/reports') return 'Academic Terminal Reports';
    if (p === '/exam-officer/broadsheet') return 'Master Broadsheet Overview';
    if (p === '/change-password') return 'Account Security';
    if (p === '/verify-result') return 'Public Result Verification';
    return 'EduTrack System';
  };

  const navItems = getNavItems();
  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'US';

  return (
    <div className="app-layout">
      
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Fixed Vertical Sidebar Navigation */}
      <aside className={`app-sidebar ${sidebarOpen ? 'open' : ''}`}>
        
        {/* Sidebar Brand Header */}
        <div className="sidebar-brand">
          <div className="brand-logo-wrapper">
            {school?.logo_url ? (
              <img 
                src={school.logo_url} 
                alt={school?.name || 'School Logo'} 
                className="brand-logo-img"
              />
            ) : (
              <div className="brand-logo-fallback">
                <Building2 size={24} color="#fff" />
              </div>
            )}
          </div>
          <div className="brand-info">
            <h1 className="brand-name">{school?.name || 'EduTrack System'}</h1>
            <span className="brand-sub">Enterprise Portal</span>
          </div>
          <button 
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items Group */}
        <div className="sidebar-nav-container">
          <div className="nav-section-label">Main Menu</div>
          <nav className="sidebar-nav">
            {navItems.map((item) => {
              const IconComp = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  type="button"
                  className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                >
                  <IconComp className="nav-item-icon" size={19} />
                  <span className="nav-item-text">{item.label}</span>
                  {isActive && <div className="active-pill-indicator" />}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Bottom Profile Card */}
        <div className="sidebar-footer">
          <div className="user-mini-card">
            <div className="user-avatar-badge">
              {initials}
            </div>
            <div className="user-mini-details">
              <span className="user-mini-name">{user?.name}</span>
              <span className="user-mini-role">{getRoleName(user?.role)}</span>
            </div>
          </div>
        </div>

      </aside>

      {/* Top Header Bar */}
      <header className="app-header glass-panel">
        
        <div className="header-left">
          <button 
            className="mobile-menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Menu size={22} />
          </button>
          <div>
            <h2 className="header-title">{getPageTitle()}</h2>
            <div className="header-breadcrumb">
              <span>EduTrack</span> <ChevronRight size={12} /> <span>{getPageTitle()}</span>
            </div>
          </div>
        </div>

        <div className="header-right">
          
          {/* Notification Bell Dropdown */}
          <div className="notification-wrapper">
            <button 
              className="header-icon-btn"
              onClick={() => setShowNotifications(!showNotifications)}
              title="System Alerts & Notifications"
            >
              <Bell size={18} />
              <span className="notification-pulse-dot" />
            </button>

            {showNotifications && (
              <div className="notification-dropdown glass-panel animate-slide-up">
                <div className="notification-header">
                  <h3>System Notifications</h3>
                  <span className="notification-count">2 New</span>
                </div>
                <div className="notification-list">
                  <div className="notification-item">
                    <CheckCircle2 size={18} color="#00e676" style={{ marginTop: '2px', shrink: 0 }} />
                    <div>
                      <p className="notification-msg">Database Validation Engine operational.</p>
                      <span className="notification-time">Just now</span>
                    </div>
                  </div>
                  <div className="notification-item">
                    <AlertCircle size={18} color="#7b93ff" style={{ marginTop: '2px', shrink: 0 }} />
                    <div>
                      <p className="notification-msg">Score max limits set: CA ({school?.max_ca_score || 30}%), Exam ({school?.max_exam_score || 70}%).</p>
                      <span className="notification-time">10 mins ago</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button 
            onClick={toggleTheme} 
            className="header-icon-btn"
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? <Sun size={18} color="#ffb400" /> : <Moon size={18} color="#7b93ff" />}
          </button>

          {/* Role Pill Badge */}
          <span className="badge header-role-badge" style={getRoleBadgeStyle(user?.role)}>
            {getRoleName(user?.role)}
          </span>

          {/* Sign Out Button */}
          <button 
            onClick={handleLogout} 
            className="btn-logout"
            disabled={loggingOut}
          >
            {loggingOut ? <span className="spinner spinner-sm"></span> : <LogOut size={16} />}
            <span className="logout-text">Sign Out</span>
          </button>

        </div>

      </header>

      {/* Main Page Area */}
      <main className="app-content animate-fade-in">
        {children}
      </main>

    </div>
  );
};

export default AppLayout;
