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
import SubjectAssignments from './pages/admin/SubjectAssignments';
import ClassPromotion from './pages/admin/ClassPromotion';
import BulkUpload from './pages/admin/BulkUpload';
import ResultsEntry from './pages/teacher/ResultsEntry';
import Approvals from './pages/exam-officer/Approvals';
import Reports from './pages/exam-officer/Reports';
import Broadsheet from './pages/exam-officer/Broadsheet';
import MySubjects from './pages/teacher/MySubjects';
import ChangePassword from './pages/shared/ChangePassword';
import VerifyResult from './pages/shared/VerifyResult';

// Form Master Pages
import ClassRoster from './pages/form-master/ClassRoster';
import ClassAttendance from './pages/form-master/ClassAttendance';
import ClassResults from './pages/form-master/ClassResults';
import ClassRemarks from './pages/form-master/ClassRemarks';

// Bursar Pages
import FeePayments from './pages/bursar/FeePayments';

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
            <Route path="/verify-result/:hash" element={<VerifyResult />} />
            
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
            
            {/* Fallback to Dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </SchoolProvider>
    </AuthProvider>
  );
}

export default App;
