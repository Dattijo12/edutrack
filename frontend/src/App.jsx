import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from './context/AuthContext';
import { SchoolProvider } from './context/SchoolContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

import Login from './pages/auth/Login';
import Dashboard from './pages/Dashboard';
import Classes from './pages/admin/Classes';
import Subjects from './pages/admin/Subjects';
import Students from './pages/admin/Students';
import SchoolSettings from './pages/admin/SchoolSettings';
import UserManagement from './pages/admin/UserManagement';
import ResultsEntry from './pages/teacher/ResultsEntry';
import Approvals from './pages/exam-officer/Approvals';
import Reports from './pages/exam-officer/Reports';
import Broadsheet from './pages/exam-officer/Broadsheet';
import MySubjects from './pages/teacher/MySubjects';
import ChangePassword from './pages/shared/ChangePassword';
import VerifyResult from './pages/shared/VerifyResult';

function App() {
  return (
    <AuthProvider>
      <SchoolProvider>
        <Router>
          {/* Animated background mesh */}
          <div className="bg-mesh"></div>
          <ToastContainer position="top-right" autoClose={3500} theme="colored" />
          
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/verify-result" element={<VerifyResult />} />
            
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
            
            {/* Exam Officer Approvals */}
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
            
            {/* Exam Officer Reports */}
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
            
            {/* Fallback to Dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </SchoolProvider>
    </AuthProvider>
  );
}

export default App;
