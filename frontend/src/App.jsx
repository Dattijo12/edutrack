import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
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

function App() {
  return (
    <AuthProvider>
      <Router>
        {/* Animated background mesh */}
        <div className="bg-mesh"></div>
        
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin/classes" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Classes />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin/subjects" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Subjects />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/admin/students" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Students />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin/settings" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <SchoolSettings />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <UserManagement />
              </ProtectedRoute>
            } 
          />
          
          {/* Teacher results entry */}
          <Route 
            path="/teacher/results-entry" 
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <ResultsEntry />
              </ProtectedRoute>
            } 
          />
          
          {/* Teacher My Subjects */}
          <Route 
            path="/teacher/my-subjects" 
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <MySubjects />
              </ProtectedRoute>
            } 
          />
          
          {/* Exam Officer Approvals */}
          <Route 
            path="/exam-officer/approvals" 
            element={
              <ProtectedRoute allowedRoles={['exam_officer']}>
                <Approvals />
              </ProtectedRoute>
            } 
          />
          
          {/* Exam Officer Reports */}
          <Route 
            path="/exam-officer/reports" 
            element={
              <ProtectedRoute allowedRoles={['exam_officer']}>
                <Reports />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/exam-officer/broadsheet" 
            element={
              <ProtectedRoute allowedRoles={['exam_officer']}>
                <Broadsheet />
              </ProtectedRoute>
            } 
          />
          
          {/* Fallback to Dashboard (which redirects to Login if unauthenticated) */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
