import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { AlertTriangle, RefreshCw, Printer, ShieldAlert } from 'lucide-react';
import guardianService from '../../services/guardianService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const GuardianDashboard = () => {
  const [guardian, setGuardian] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected Student & Report Card State
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [reportCardData, setReportCardData] = useState(null);
  const [loadingReportCard, setLoadingReportCard] = useState(false);
  const [isReportCardOpen, setIsReportCardOpen] = useState(false);

  // Financial Fee Lock Modal State
  const [feeLockInfo, setFeeLockInfo] = useState(null);
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await guardianService.getDashboard();
      setGuardian(data.guardian);
      setStudents(Array.isArray(data.students) ? data.students : []);
    } catch (err) {
      console.error('Failed to load guardian dashboard:', err);
      const errMsg = err?.response?.data?.message || 'Failed to load your guardian profile and students.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleViewResult = async (studentId) => {
    const student = students.find(s => s.id === studentId);
    setSelectedStudent(student);
    setLoadingReportCard(true);
    setReportCardData(null);
    setFeeLockInfo(null);

    try {
      const data = await guardianService.getStudentResults(studentId);
      setReportCardData(data);
      setIsReportCardOpen(true);
      toast.success(`Report Card loaded for ${student?.name || student?.first_name || 'Student'}!`);
    } catch (err) {
      console.error('Error fetching report card:', err);
      if (err?.response?.data?.locked || err?.response?.status === 403) {
        const lockData = err?.response?.data || {};
        setFeeLockInfo({
          studentName: student?.name || `${student?.first_name || ''} ${student?.last_name || ''}`.trim() || 'Student',
          admissionNumber: student?.admission_number,
          message: lockData.message || 'Report Card is locked due to outstanding school fee balance. Please visit or contact the Bursar office.',
        });
        setIsLockModalOpen(true);
      } else {
        toast.error(err?.response?.data?.message || 'Unable to load report card. Please try again later.');
      }
    } finally {
      setLoadingReportCard(false);
    }
  };

  const handlePrintReportCard = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-gray-600 font-medium">Loading your Guardian Portal...</p>
      </div>
    );
  }

  if (error && !guardian) {
    return (
      <div className="max-w-4xl mx-auto my-12 p-8 bg-white rounded-2xl shadow-sm border border-gray-100 text-center">
        <AlertTriangle size={52} className="mx-auto text-amber-500 mb-4" />
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Guardian Profile Error</h3>
        <p className="text-gray-600 mb-6">{error}</p>
        <button onClick={fetchDashboardData} className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-2 font-medium">
          <RefreshCw size={16} /> Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* 1. Welcome Banner */}
      <div className="bg-indigo-900 rounded-2xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-bold mb-4">Welcome, {guardian?.name || 'Guardian'}</h1>
        <div className="flex flex-wrap items-center gap-4 text-sm opacity-90">
          <span className="font-semibold bg-indigo-800 px-3 py-1 rounded-full">Guardian Portal</span>
          <span>•</span>
          <span>Relationship: {guardian?.relationship || 'N/A'}</span>
          <span>•</span>
          <span>Phone: {guardian?.phone || 'N/A'}</span>
        </div>
      </div>

      {/* 2. Wards/Students Grid */}
      <div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
          Your Wards / Students ({students?.length || 0})
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students && students.map(student => (
            <div key={student.id} className="bg-white dark:bg-slate-800 rounded-xl shadow-md border border-gray-200 dark:border-slate-700 p-6 flex flex-col h-full hover:shadow-lg transition-shadow">
              {/* Card Header */}
              <div className="flex justify-between items-start mb-4 border-b border-gray-100 dark:border-slate-700 pb-3">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {student.name || `${student.first_name || ''} ${student.last_name || ''}`.trim()}
                </h3>
              </div>
              
              {/* Card Body */}
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300 mb-6 flex-grow">
                <p><span className="font-semibold text-gray-800 dark:text-gray-200">Adm No:</span> {student.admission_number}</p>
                <p><span className="font-semibold text-gray-800 dark:text-gray-200">Class:</span> {student.class?.name ? `${student.class.name} ${student.class.arm || ''}` : 'N/A'}</p>
                <div className="flex items-center gap-2 pt-2">
                  <span className="font-semibold text-gray-800 dark:text-gray-200">Clearance: </span>
                  {student.fee_cleared_status ? (
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-bold">Cleared</span>
                  ) : (
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-bold">Outstanding</span>
                  )}
                </div>
              </div>
              
              {/* Card Footer / Action */}
              <button 
                onClick={() => handleViewResult(student.id)}
                disabled={loadingReportCard && selectedStudent?.id === student.id}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-medium transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loadingReportCard && selectedStudent?.id === student.id ? (
                  <>
                    <span className="spinner spinner-sm"></span> Loading...
                  </>
                ) : (
                  'View Report Card'
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* FINANCIAL GATEKEEPER LOCK MODAL */}
      <Dialog open={isLockModalOpen} onOpenChange={setIsLockModalOpen}>
        <DialogContent className="max-w-md bg-white border border-amber-200 text-gray-900 rounded-2xl p-6 shadow-xl">
          <DialogHeader className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <ShieldAlert size={36} />
            </div>
            <DialogTitle className="text-xl font-bold text-amber-700">
              Report Card Access Restricted
            </DialogTitle>
            <DialogDescription className="text-gray-500 text-sm">
              Financial Clearance Gatekeeper Notice
            </DialogDescription>
          </DialogHeader>

          <div className="my-4 p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 text-sm space-y-3">
            <p className="font-semibold text-gray-900">
              Student: <span className="text-amber-800 font-bold">{feeLockInfo?.studentName}</span> ({feeLockInfo?.admissionNumber})
            </p>
            <p className="text-gray-700 leading-relaxed text-xs sm:text-sm">
              {feeLockInfo?.message}
            </p>
          </div>

          <div className="text-xs text-gray-500 text-center space-y-1">
            <p>Please contact the Bursar office to clear outstanding balances.</p>
          </div>

          <div className="mt-6">
            <button
              onClick={() => setIsLockModalOpen(false)}
              className="w-full bg-indigo-600 text-white font-semibold py-2.5 rounded-lg hover:bg-indigo-700 transition-colors text-sm"
            >
              Understood
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* SUCCESSFUL REPORT CARD MODAL */}
      <Dialog open={isReportCardOpen} onOpenChange={setIsReportCardOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white text-gray-900 rounded-2xl p-6 sm:p-8 shadow-2xl printable-area">
          <DialogHeader className="no-print flex flex-row items-center justify-between border-b border-gray-200 pb-4 mb-4">
            <div>
              <DialogTitle className="text-xl font-bold text-gray-900">
                Official Student Report Card
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                Session: {reportCardData?.session} | Term: {reportCardData?.term}
              </DialogDescription>
            </div>
            <button
              onClick={handlePrintReportCard}
              className="px-4 py-2 text-xs font-semibold flex items-center gap-2 bg-indigo-900 text-white rounded-lg hover:bg-indigo-800 transition-colors"
            >
              <Printer size={14} /> Print Report Card
            </button>
          </DialogHeader>

          {reportCardData && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="text-center border-b-2 border-gray-800 pb-4">
                <h2 className="text-2xl font-black tracking-wider uppercase text-gray-900">
                  {reportCardData.school?.name || 'EduTrack International Academy'}
                </h2>
                <p className="text-xs text-gray-600">{reportCardData.school?.address}</p>
                <h3 className="text-lg font-bold text-indigo-700 mt-2">TERMINAL STUDENT REPORT CARD</h3>
              </div>

              {/* Student Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div>
                  <span className="text-gray-500 block">Student Name:</span>
                  <strong className="text-gray-900 text-sm">{selectedStudent?.name || `${selectedStudent?.first_name || ''} ${selectedStudent?.last_name || ''}`.trim()}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block">Admission Number:</span>
                  <strong className="text-gray-900 text-sm">{selectedStudent?.admission_number}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block">Class:</span>
                  <strong className="text-gray-900 text-sm">{selectedStudent?.class?.name} {selectedStudent?.class?.arm || ''}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block">Academic Session:</span>
                  <strong className="text-gray-900">{reportCardData.session}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block">Term:</span>
                  <strong className="text-gray-900">{reportCardData.term}</strong>
                </div>
              </div>

              {/* Subject Results Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100 text-gray-800 font-bold border-b border-gray-300">
                      <th className="p-2.5 border border-gray-300">Subject</th>
                      <th className="p-2.5 border border-gray-300 text-center">CA Score</th>
                      <th className="p-2.5 border border-gray-300 text-center">Exam Score</th>
                      <th className="p-2.5 border border-gray-300 text-center">Total</th>
                      <th className="p-2.5 border border-gray-300 text-center">Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(reportCardData.results) && reportCardData.results.length > 0 ? (
                      reportCardData.results.map((res, idx) => (
                        <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="p-2.5 border border-gray-300 font-semibold text-gray-800">
                            {res.subject?.name || 'Subject'}
                          </td>
                          <td className="p-2.5 border border-gray-300 text-center">{res.ca_score}</td>
                          <td className="p-2.5 border border-gray-300 text-center">{res.exam_score}</td>
                          <td className="p-2.5 border border-gray-300 text-center font-bold text-gray-900">{res.total_score}</td>
                          <td className="p-2.5 border border-gray-300 text-center font-bold text-indigo-700">{res.grade}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-gray-500">
                          No approved subject scores found for this term.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="text-right text-xs text-gray-400 pt-4 border-t border-gray-200">
                Generated via Guardian Self-Service Portal
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GuardianDashboard;
