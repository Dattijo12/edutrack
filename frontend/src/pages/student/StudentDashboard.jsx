import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  GraduationCap, 
  Award, 
  BookOpen, 
  Clock, 
  Download, 
  LogOut, 
  RefreshCw, 
  UserCheck, 
  MessageSquare, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar, 
  ShieldCheck, 
  Sparkles,
  BarChart3,
  Building2,
  Lock
} from 'lucide-react';
import studentService from '../../services/studentService';

/**
 * StudentDashboard Component
 * Main dashboard view for authenticated students to view their terminal results,
 * position, attendance, and official school remarks.
 */
const StudentDashboard = () => {
  const navigate = useNavigate();

  // Selected session and term filters
  const [session, setSession] = useState('2025/2026');
  const [term, setTerm] = useState('1st Term');

  // Result and profile state
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reportData, setReportData] = useState(null);

  // Status flags
  const [isPublished, setIsPublished] = useState(true);
  const [isFeeLocked, setIsFeeLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState('');

  // Persisted student profile
  const storedStudent = JSON.parse(localStorage.getItem('student') || '{}');

  /**
   * Fetch results for the active student
   */
  const fetchStudentResults = useCallback(async (showToast = false) => {
    if (showToast) setRefreshing(true);
    setLoading(true);
    setIsFeeLocked(false);
    setIsPublished(true);

    try {
      const data = await studentService.getStudentResults(session, term);

      if (data?.status === 'success' || data?.published) {
        setReportData(data);
        setIsPublished(true);
        setIsFeeLocked(false);
        if (showToast) toast.success('Report card loaded successfully!');
      } else {
        setIsPublished(false);
        setReportData(null);
      }
    } catch (err) {
      console.warn('Student results fetch response:', err);

      const status = err?.response?.status;
      const responseData = err?.response?.data;

      if (responseData?.locked || responseData?.fee_cleared_status === false) {
        // State 3: Financial Gatekeeper Lock
        setIsFeeLocked(true);
        setLockMessage(responseData?.message || 'Report card is locked due to outstanding school fees.');
        setReportData(null);
      } else if (status === 403 || responseData?.published === false) {
        // State 1: Results Not Published Yet
        setIsPublished(false);
        setReportData(null);
      } else {
        // General error / fallback
        setIsPublished(false);
        setReportData(null);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [session, term]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      toast.info('Please log in with your admission number to view your results.');
      navigate('/student/login');
      return;
    }
    fetchStudentResults();
  }, [fetchStudentResults, navigate]);

  /**
   * Handle student logout
   */
  const handleLogout = async () => {
    try {
      await studentService.studentLogout();
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('student');
      localStorage.removeItem('user');
      toast.info('Signed out of Student Portal.');
      navigate('/student/login');
    }
  };

  /**
   * Download the server-generated PDF report card via secure API call.
   * Creates a temporary object URL to trigger the browser's native download.
   */
  const [downloading, setDownloading] = useState(false);
  const handleDownloadPDF = async () => {
    setDownloading(true);
    toast.info('Generating official Report Card PDF...');

    try {
      const blob = await studentService.downloadReportCard(session, term);
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;

      // Build a clean filename
      const safeName = (studentInfo?.name || 'Student').replace(/[^a-zA-Z0-9]/g, '_');
      link.setAttribute('download', `ReportCard_${safeName}_${session}_${term}.pdf`);

      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Report Card PDF downloaded successfully!');
    } catch (err) {
      console.error('PDF download error:', err);

      // When responseType is 'blob', Axios wraps error responses as Blob objects.
      // We must read the Blob as text and parse as JSON to extract the server message.
      let message = 'Failed to download report card PDF. Please try again.';
      try {
        if (err?.response?.data instanceof Blob) {
          const text = await err.response.data.text();
          const parsed = JSON.parse(text);
          message = parsed?.message || message;
        } else if (err?.response?.data?.message) {
          message = err.response.data.message;
        }
      } catch (_parseErr) {
        // Ignore parse errors; fall back to the default message
      }
      toast.error(message);
    } finally {
      setDownloading(false);
    }
  };

  // Student display info
  const studentInfo = reportData?.student || storedStudent;
  const studentName = studentInfo?.name || `${studentInfo?.first_name || ''} ${studentInfo?.last_name || ''}`.trim() || 'Student';
  const admissionNumber = studentInfo?.admission_number || 'N/A';
  const className = studentInfo?.class?.full_name || studentInfo?.class?.name || 'Class Roster';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Navbar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Portal Brand */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white shadow-md shadow-indigo-600/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                EduTrack Student Portal
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Academic Results & Performance Terminal
              </p>
            </div>
          </div>

          {/* Student Info & Sign Out */}
          <div className="flex items-center gap-3">
            <Link
              to="/student/timetable"
              className="px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-white hover:bg-indigo-600 dark:hover:bg-indigo-600 border border-indigo-200 dark:border-indigo-800 rounded-xl transition-all flex items-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Class Timetable</span>
            </Link>

            <div className="hidden sm:block text-right">
              <div className="text-xs font-bold text-slate-900 dark:text-white">
                {studentName}
              </div>
              <div className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400">
                {admissionNumber}
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-white hover:bg-rose-600 dark:hover:bg-rose-600 border border-rose-200 dark:border-rose-900/60 rounded-xl transition-all flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Banner Card / Filter Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" /> Academic Terminal
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Terminal Report Card
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {studentName} • {admissionNumber} • {className}
            </p>
          </div>

          {/* Term & Session Filters */}
          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={session}
              onChange={(e) => setSession(e.target.value)}
              className="p-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="2025/2026">2025/2026</option>
              <option value="2024/2025">2024/2025</option>
            </select>

            <select
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="p-2 text-xs font-semibold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="1st Term">1st Term</option>
              <option value="2nd Term">2nd Term</option>
              <option value="3rd Term">3rd Term</option>
            </select>

            <button
              onClick={() => fetchStudentResults(true)}
              disabled={refreshing}
              className="p-2 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              title="Refresh results"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* LOADING STATE */}
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[380px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-slate-500">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-semibold">Retrieving your terminal results...</p>
          </div>
        ) : isFeeLocked ? (
          /* STATE 3: FINANCIAL LOCK BANNER */
          <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl p-8 text-center max-w-2xl mx-auto shadow-sm animate-in fade-in">
            <div className="w-14 h-14 bg-rose-100 dark:bg-rose-900/60 rounded-2xl flex items-center justify-center mx-auto text-rose-600 dark:text-rose-400 mb-4">
              <Lock className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-rose-900 dark:text-rose-200 mb-2">
              Report Card Temporarily Locked
            </h3>
            <p className="text-sm text-rose-700 dark:text-rose-300 leading-relaxed mb-4">
              {lockMessage || 'Your report card is locked due to an outstanding school fee balance. Please contact the Bursar’s office for financial clearance.'}
            </p>
            <div className="text-xs text-rose-600 dark:text-rose-400 font-mono">
              Student ID: {admissionNumber}
            </div>
          </div>
        ) : !isPublished ? (
          /* STATE 1: NOT PUBLISHED EMPTY STATE */
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center max-w-2xl mx-auto shadow-sm animate-in fade-in">
            <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/60 rounded-2xl border border-amber-200 dark:border-amber-900/80 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400 mb-5 shadow-sm">
              <Clock className="w-8 h-8 animate-pulse" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
              Results Not Published Yet
            </h3>
            
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-6 max-w-lg mx-auto">
              Your results for this term are not yet published. Please check back later.
            </p>

            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl p-4 text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto flex items-center gap-3 text-left">
              <ShieldCheck className="w-5 h-5 text-indigo-500 flex-shrink-0" />
              <span>The Super Admin and Examination Committee are currently compiling and reviewing student score endorsements.</span>
            </div>
          </div>
        ) : (
          /* STATE 2: PUBLISHED REPORT CARD */
          <div className="space-y-6 animate-in fade-in">
            {/* Top Aggregate Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Marks */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-950/80 rounded-xl text-indigo-600 dark:text-indigo-400">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Total Score</div>
                  <div className="text-xl font-black text-slate-900 dark:text-white">
                    {reportData?.summary?.total_score ?? 0}
                  </div>
                </div>
              </div>

              {/* Average % */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/80 rounded-xl text-emerald-600 dark:text-emerald-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Average (%)</div>
                  <div className="text-xl font-black text-slate-900 dark:text-white">
                    {reportData?.summary?.average ?? 0}%
                  </div>
                </div>
              </div>

              {/* Class Position */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
                <div className="p-3 bg-purple-50 dark:bg-purple-950/80 rounded-xl text-purple-600 dark:text-purple-400">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Class Position</div>
                  <div className="text-xl font-black text-slate-900 dark:text-white">
                    {reportData?.summary?.class_position ?? 'N/A'}
                  </div>
                </div>
              </div>

              {/* Attendance */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3.5">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/80 rounded-xl text-amber-600 dark:text-amber-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Attendance</div>
                  <div className="text-xl font-black text-slate-900 dark:text-white">
                    {reportData?.summary?.attendance_present ?? 65} / {reportData?.summary?.attendance_total ?? 70}
                  </div>
                </div>
              </div>
            </div>

            {/* Subject Grade Breakdown Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    Subject Performance Breakdown
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Continuous Assessment (CA) and Examination Scores
                  </p>
                </div>

                {/* PDF Download Button */}
                <button
                  onClick={handleDownloadPDF}
                  disabled={downloading}
                  className={`px-4 py-2 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center gap-2 ${
                    downloading
                      ? 'bg-indigo-400 cursor-not-allowed opacity-70'
                      : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
                  }`}
                >
                  {downloading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Downloading…</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Report Card (PDF)</span>
                    </>
                  )}
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 font-bold">
                      <th className="px-6 py-3.5">Subject</th>
                      <th className="px-6 py-3.5 text-center">CA (30)</th>
                      <th className="px-6 py-3.5 text-center">Exam (70)</th>
                      <th className="px-6 py-3.5 text-center">Total (100)</th>
                      <th className="px-6 py-3.5 text-center">Grade</th>
                      <th className="px-6 py-3.5">Remark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {reportData?.results?.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-400 text-xs">
                          No approved subject records recorded for this term.
                        </td>
                      </tr>
                    ) : (
                      reportData?.results?.map((res) => (
                        <tr key={res.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                            {res.subject_name}
                            <span className="block text-[11px] font-mono text-slate-400 font-normal">
                              {res.subject_code}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center font-medium text-slate-700 dark:text-slate-300">
                            {res.ca_score}
                          </td>
                          <td className="px-6 py-4 text-center font-medium text-slate-700 dark:text-slate-300">
                            {res.exam_score}
                          </td>
                          <td className="px-6 py-4 text-center font-bold text-slate-900 dark:text-white">
                            {res.total_score}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-black ${
                              res.total_score >= 75 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                              res.total_score >= 60 ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300' :
                              res.total_score >= 50 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                              'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            }`}>
                              {res.grade || 'C'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-600 dark:text-slate-400">
                            {res.remark || 'Satisfactory'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Official Remarks Cards (Form Master & Principal) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Form Master's Remark */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  <UserCheck className="w-4 h-4" />
                  Form Master's Remark
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed">
                  "{reportData?.summary?.form_master_remark || 'An attentive and disciplined student. Keeps up good performance.'}"
                </p>
              </div>

              {/* Principal's Remark */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                  <MessageSquare className="w-4 h-4" />
                  Principal's Endorsement
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 italic leading-relaxed">
                  "{reportData?.summary?.principal_remark || 'A commendable result. Recommended for promotion to the next level.'}"
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default StudentDashboard;
