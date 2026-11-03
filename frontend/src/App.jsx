import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from './context/AuthContext';
import { SchoolProvider } from './context/SchoolContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

// Clean, centered loading spinner fallback for lazy chunk loading
const PageLoader = () => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      width: '100%',
      gap: '16px',
      color: 'hsl(var(--text-secondary))',
    }}
  >
    <div
      className="spinner"
      style={{
        width: '40px',
        height: '40px',
        borderWidth: '3px',
        borderTopColor: '#00f2fe',
      }}
    ></div>
    <span style={{ fontSize: '14px', fontWeight: 500, letterSpacing: '0.5px' }}>
      Loading module...
    </span>
  </div>
);

// Code-Split Page Imports via React.lazy
const Login = lazy(() => import('./pages/auth/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Classes = lazy(() => import('./pages/admin/Classes'));
const Subjects = lazy(() => import('./pages/admin/Subjects'));
const Students = lazy(() => import('./pages/admin/Students'));
const SchoolSettings = lazy(() => import('./pages/admin/SchoolSettings'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const SubjectAssignments = lazy(() => import('./pages/admin/SubjectAssignments'));
const ClassPromotion = lazy(() => import('./pages/admin/ClassPromotion'));
const BulkUpload = lazy(() => import('./pages/admin/BulkUpload'));
const ResultWindowManagement = lazy(() => import('./pages/admin/ResultWindowManagement'));
const SuperAdminRemarks = lazy(() => import('./pages/admin/SuperAdminRemarks'));
const AuditTrail = lazy(() => import('./pages/admin/AuditTrail'));
const StudentPromotion = lazy(() => import('./pages/admin/StudentPromotion'));
const ResultsEntry = lazy(() => import('./pages/teacher/ResultsEntry'));
const Approvals = lazy(() => import('./pages/exam-officer/Approvals'));
const Reports = lazy(() => import('./pages/exam-officer/Reports'));
const Broadsheet = lazy(() => import('./pages/exam-officer/Broadsheet'));
const MySubjects = lazy(() => import('./pages/teacher/MySubjects'));
const ChangePassword = lazy(() => import('./pages/shared/ChangePassword'));
const VerifyResult = lazy(() => import('./pages/shared/VerifyResult'));

// Form Master Pages
const ClassRoster = lazy(() => import('./pages/form-master/ClassRoster'));
const ClassAttendance = lazy(() => import('./pages/form-master/ClassAttendance'));
const ClassResults = lazy(() => import('./pages/form-master/ClassResults'));
const ClassRemarks = lazy(() => import('./pages/form-master/ClassRemarks'));

// Bursar Pages
const FeePayments = lazy(() => import('./pages/bursar/FeePayments'));

// Guardian Pages
const GuardianDashboard = lazy(() => import('./pages/guardian/GuardianDashboard'));

// Timetable Module
const TimetablePage = lazy(() => import('./pages/TimetablePage'));

// Student Portal Pages
const StudentLogin = lazy(() => import('./pages/student/StudentLogin'));
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'));

function App() {
  return (
    <AuthProvider>
      <SchoolProvider>
        <Router>
          {/* Animated background mesh */}
          <div className="bg-mesh"></div>
          <ToastContainer position="top-right" autoClose={3500} theme="colored" />
          
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/verify-result/:hash" element={<VerifyResult />} />
              
              {/* Student Portal Routes */}
              <Route path="/student/login" element={<StudentLogin />} />
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route 
                path="/student/timetable" 
                element={
                  <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-8">
                    <div className="max-w-7xl mx-auto">
                      <TimetablePage />
                    </div>
                  </div>
                } 
              />
              <Route path="/student" element={<Navigate to="/student/dashboard" replace />} />
              
              {/* Authenticated Routes wrapped in AppLayout */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <Dashboard />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/change-password" 
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <ChangePassword />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/admin/classes" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AppLayout>
                      <Classes />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/admin/subjects" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AppLayout>
                      <Subjects />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/admin/students" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AppLayout>
                      <Students />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/admin/settings" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AppLayout>
                      <SchoolSettings />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/admin/users" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AppLayout>
                      <UserManagement />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/admin/subject-assignments" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AppLayout>
                      <SubjectAssignments />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/admin/class-promotion" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AppLayout>
                      <ClassPromotion />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/admin/bulk-upload" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AppLayout>
                      <BulkUpload />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/admin/result-windows" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AppLayout>
                      <ResultWindowManagement />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/admin/remarks" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AppLayout>
                      <SuperAdminRemarks />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/admin/audit-trail" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AppLayout>
                      <AuditTrail />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/admin/promotions" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AppLayout>
                      <StudentPromotion />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />
              
              {/* Teacher results entry */}
              <Route 
                path="/teacher/results-entry" 
                element={
                  <ProtectedRoute allowedRoles={['teacher', 'form_master']}>
                    <AppLayout>
                      <ResultsEntry />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />
              
              {/* Teacher My Subjects */}
              <Route 
                path="/teacher/my-subjects" 
                element={
                  <ProtectedRoute allowedRoles={['teacher', 'form_master']}>
                    <AppLayout>
                      <MySubjects />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />
              
              {/* Form Master Routes */}
              <Route 
                path="/form-master/roster" 
                element={
                  <ProtectedRoute allowedRoles={['form_master', 'admin']}>
                    <AppLayout>
                      <ClassRoster />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/form-master/attendance" 
                element={
                  <ProtectedRoute allowedRoles={['form_master', 'admin']}>
                    <AppLayout>
                      <ClassAttendance />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/form-master/results" 
                element={
                  <ProtectedRoute allowedRoles={['form_master', 'admin']}>
                    <AppLayout>
                      <ClassResults />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/form-master/remarks" 
                element={
                  <ProtectedRoute allowedRoles={['form_master', 'admin']}>
                    <AppLayout>
                      <ClassRemarks />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />

              {/* Bursar Routes */}
              <Route 
                path="/bursar/fee-payments" 
                element={
                  <ProtectedRoute allowedRoles={['bursar', 'admin']}>
                    <AppLayout>
                      <FeePayments />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />
              
              {/* Exam Officer Routes */}
              <Route 
                path="/exam-officer/approvals" 
                element={
                  <ProtectedRoute allowedRoles={['exam_officer']}>
                    <AppLayout>
                      <Approvals />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/exam-officer/reports" 
                element={
                  <ProtectedRoute allowedRoles={['exam_officer']}>
                    <AppLayout>
                      <Reports />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/exam-officer/broadsheet" 
                element={
                  <ProtectedRoute allowedRoles={['exam_officer']}>
                    <AppLayout>
                      <Broadsheet />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/guardian/dashboard" 
                element={
                  <ProtectedRoute allowedRoles={['guardian', 'parent', 'admin']}>
                    <AppLayout>
                      <GuardianDashboard />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />

              {/* Class Timetable Module Routes */}
              <Route 
                path="/admin/timetable" 
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AppLayout>
                      <TimetablePage />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/teacher/timetable" 
                element={
                  <ProtectedRoute allowedRoles={['teacher', 'form_master', 'admin']}>
                    <AppLayout>
                      <TimetablePage />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/exam-officer/timetable" 
                element={
                  <ProtectedRoute allowedRoles={['exam_officer', 'admin']}>
                    <AppLayout>
                      <TimetablePage />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />

              <Route 
                path="/timetable" 
                element={
                  <ProtectedRoute>
                    <AppLayout>
                      <TimetablePage />
                    </AppLayout>
                  </ProtectedRoute>
                } 
              />

              {/* Fallback to Dashboard */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </SchoolProvider>
    </AuthProvider>
  );
}

export default App;
