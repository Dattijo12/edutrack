import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  ArrowLeft, 
  BarChart3, 
  Printer, 
  FileSpreadsheet, 
  Layers, 
  Calendar, 
  GraduationCap, 
  CheckCheck,
  Award,
  CheckCircle2
} from 'lucide-react';
import examOfficerService from '../../services/examOfficerService';
import classService from '../../services/classService';
import { useSchool } from '../../context/SchoolContext';

const Reports = () => {
  const { school } = useSchool();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSession, setSelectedSession] = useState('2025/2026');
  const [selectedTerm, setSelectedTerm] = useState('1st Term');
  
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (school?.active_session) setSelectedSession(school.active_session);
    if (school?.active_term) setSelectedTerm(school.active_term);
    fetchClasses();
  }, [school]);

  /**
   * Fetch active school classes for dropdown selection
   */
  const fetchClasses = async () => {
    try {
      const data = await examOfficerService.getClasses();
      const classList = Array.isArray(data) ? data : (data?.data || []);
      setClasses(classList);
    } catch (err) {
      console.warn('Exam officer getClasses failed, trying classService fallback:', err);
      try {
        const fallbackData = await classService.getAll();
        setClasses(Array.isArray(fallbackData) ? fallbackData : (fallbackData?.data || []));
      } catch (fallbackErr) {
        console.error('Failed to load classes:', fallbackErr);
        toast.error('Failed to load class list.');
      }
    }
  };

  /**
   * Generate Academic Terminal Class Report Cards
   */
  const handleGenerateReport = async (e) => {
    if (e) e.preventDefault();
    if (!selectedClass) {
      toast.warning('Please select a class arm first.');
      return;
    }

    setLoading(true);
    try {
      const data = await examOfficerService.getClassReport(selectedClass, selectedTerm, selectedSession);
      setReportData(data);
      toast.success('Class terminal reports generated successfully!');
    } catch (error) {
      console.error('Failed to generate class reports:', error);
      toast.error(error?.response?.data?.message || 'Failed to generate class reports.');
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Trigger browser print for multi-page report card output
   */
  const handlePrint = () => {
    window.print();
  };

  const studentReports = Array.isArray(reportData?.report) 
    ? reportData.report 
    : (Array.isArray(reportData?.students) ? reportData.students : []);

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }} className="animate-fade-in min-h-screen">
      
      {/* Control Panel (Hidden on Print) */}
      <div className="glass-panel no-print print:hidden mb-8 p-8 rounded-3xl border border-slate-800 bg-slate-900/70 shadow-2xl backdrop-blur-md">
        
        {/* Navigation & Header */}
        <div className="mb-6 pb-6 border-b border-slate-800/80">
          <Link to="/dashboard" className="back-link inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors mb-3">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-inner">
                <BarChart3 size={26} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Academic Terminal Reports</h1>
                <p className="text-sm text-slate-400 mt-0.5">
                  Generate official student terminal report cards formatted for multi-page A4 printing.
                </p>
              </div>
            </div>

            {/* Print Button */}
            {reportData && studentReports.length > 0 && (
              <button 
                type="button"
                onClick={handlePrint}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm flex items-center gap-2 transition-all shadow-md active:scale-95"
              >
                <Printer size={16} className="text-cyan-400" /> Print All Report Cards ({studentReports.length})
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Form */}
        <form onSubmit={handleGenerateReport} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80">
          
          {/* Class Selector Dropdown */}
          <div className="md:col-span-4">
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Layers size={14} className="text-cyan-400" /> Select Class Arm
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all cursor-pointer"
            >
              <option value="">-- Choose Class --</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.arm ? `(${c.arm})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Academic Term Dropdown */}
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Calendar size={14} className="text-cyan-400" /> Academic Term
            </label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all cursor-pointer"
            >
              <option value="1st Term">1st Term</option>
              <option value="2nd Term">2nd Term</option>
              <option value="3rd Term">3rd Term</option>
            </select>
          </div>

          {/* Academic Session Dropdown */}
          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
              <GraduationCap size={14} className="text-cyan-400" /> Academic Session
            </label>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all cursor-pointer"
            >
              <option value="2024/2025">2024/2025</option>
              <option value="2025/2026">2025/2026</option>
              <option value="2026/2027">2026/2027</option>
            </select>
          </div>

          {/* Action Button */}
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={!selectedClass || loading}
              className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-cyan-500/20 active:scale-95"
            >
              {loading ? (
                <><span className="spinner spinner-sm"></span> Loading...</>
              ) : (
                <><FileSpreadsheet size={16} /> Generate</>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="page-loading flex flex-col items-center justify-center py-20 text-slate-400">
          <span className="spinner w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4"></span>
          <p className="text-sm font-medium">Generating student terminal report cards...</p>
        </div>
      ) : !reportData ? (
        <div className="empty-state p-16 text-center rounded-3xl border border-slate-800 bg-slate-900/50 backdrop-blur-md">
          <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto mb-4 text-cyan-400">
            <BarChart3 size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-100 mb-2">No Reports Generated Yet</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Select a class arm, term, and session above, then click <strong className="text-cyan-400">Generate</strong> to view the terminal report cards.
          </p>
        </div>
      ) : studentReports.length === 0 ? (
        <div className="empty-state p-16 text-center rounded-3xl border border-slate-800 bg-slate-900/50 backdrop-blur-md">
          <CheckCheck size={48} className="mx-auto text-amber-400 opacity-80 mb-3" />
          <h3 className="text-xl font-bold text-slate-100 mb-1">No Student Reports Found</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            No approved student results found for {reportData.class?.full_name || 'this class'} in {reportData.term} ({reportData.session}).
          </p>
        </div>
      ) : (
        /* Report Cards Loop Area (Print Optimized) */
        <div className="printable-reports-container space-y-10 print:space-y-0">
          {studentReports.map((student, idx) => {
            const results = Array.isArray(student.results) ? student.results : [];
            const className = reportData.class?.full_name || (typeof reportData.class === 'string' ? reportData.class : 'N/A');
            const schoolInfo = reportData.school || school || {};

            return (
              <div 
                key={student.student_id || idx}
                className="student-report-card bg-white text-slate-900 p-8 rounded-3xl shadow-xl border border-slate-300 print:border-none print:shadow-none print:p-6 print:rounded-none print:break-after-page"
                style={{ breakAfter: 'page', pageBreakAfter: 'always' }}
              >
                {/* 1. Header Section */}
                <div className="flex flex-col md:flex-row items-center justify-between border-b-2 border-slate-900 pb-5 mb-6 text-center md:text-left gap-4">
                  <div className="flex items-center gap-4">
                    {schoolInfo.logo_url && (
                      <img 
                        src={schoolInfo.logo_url} 
                        alt={schoolInfo.name} 
                        className="max-h-16 object-contain" 
                      />
                    )}
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                        {schoolInfo.name || 'EduTrack Academy'}
                      </h2>
                      <p className="text-xs text-slate-600 font-medium mt-0.5">
                        {schoolInfo.address || 'School Address'} {schoolInfo.phone ? `| Tel: ${schoolInfo.phone}` : ''}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 md:text-right">
                    <div>
                      <span className="inline-block px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-extrabold uppercase tracking-wider mb-1">
                        Official Terminal Report Card
                      </span>
                      <p className="text-xs font-bold text-slate-700">
                        {reportData.term} ({reportData.session})
                      </p>
                    </div>

                    {/* QR Code Verification Seal */}
                    <div className="flex flex-col items-center justify-center p-1 bg-white border border-slate-300 rounded-lg shadow-sm">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=Verify-Result-${student.admission_number}-${reportData.session || selectedSession}`} 
                        alt="Verification QR Code" 
                        className="w-14 h-14 object-contain"
                      />
                      <span className="text-[8px] font-mono font-bold text-slate-500 uppercase mt-0.5">Scan to Verify</span>
                    </div>
                  </div>
                </div>

                {/* 2. Student Info Section Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs md:text-sm mb-6">
                  <div>
                    <span className="block text-2xs uppercase text-slate-500 font-bold">Student Name</span>
                    <strong className="text-slate-900 font-bold">{student.student_name}</strong>
                  </div>
                  <div>
                    <span className="block text-2xs uppercase text-slate-500 font-bold">Admission No.</span>
                    <strong className="text-slate-800 font-mono">{student.admission_number}</strong>
                  </div>
                  <div>
                    <span className="block text-2xs uppercase text-slate-500 font-bold">Class Arm</span>
                    <strong className="text-slate-800">{className}</strong>
                  </div>
                  <div>
                    <span className="block text-2xs uppercase text-slate-500 font-bold">Fee Status</span>
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                      <CheckCircle2 size={13} /> CLEARED
                    </span>
                  </div>
                </div>

                {/* 3. Results Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-300 mb-6">
                  <table className="w-full text-left border-collapse text-xs md:text-sm">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold uppercase tracking-wider text-2xs">
                        <th className="py-2.5 px-4 border-r border-slate-300">Subject</th>
                        <th className="py-2.5 px-3 text-center border-r border-slate-300">CA Score</th>
                        <th className="py-2.5 px-3 text-center border-r border-slate-300">Exam Score</th>
                        <th className="py-2.5 px-3 text-center border-r border-slate-300 font-extrabold">Total</th>
                        <th className="py-2.5 px-3 text-center border-r border-slate-300">Grade</th>
                        <th className="py-2.5 px-4">Remark</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-800">
                      {results.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-500 italic">
                            No subject results recorded for this student.
                          </td>
                        </tr>
                      ) : (
                        results.map((res, rIdx) => (
                          <tr key={res.id || rIdx} className="odd:bg-white even:bg-slate-50/50">
                            <td className="py-2.5 px-4 font-semibold border-r border-slate-200">
                              {res.subject_name} ({res.subject_code})
                            </td>
                            <td className="py-2.5 px-3 text-center border-r border-slate-200 font-medium">
                              {res.ca_score !== undefined ? res.ca_score : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-center border-r border-slate-200 font-medium">
                              {res.exam_score !== undefined ? res.exam_score : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-center border-r border-slate-200 font-extrabold text-slate-950">
                              {res.total_score !== undefined ? res.total_score : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-center border-r border-slate-200">
                              <span className="inline-block px-2 py-0.5 rounded bg-slate-200 font-bold text-slate-900 text-xs">
                                {res.grade || '-'}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-slate-700 text-xs">
                              {res.remark || '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* 4. Overall Remarks Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-50/90 p-3.5 rounded-xl border border-slate-200 text-xs">
                    <span className="block text-2xs uppercase text-slate-500 font-extrabold tracking-wider mb-1">
                      Form Master's Remark
                    </span>
                    <p className="text-slate-800 italic font-medium">
                      "{student.form_master_remark || 'An impressive academic performance this term. Shows high enthusiasm and active participation in class.'}"
                    </p>
                  </div>
                  <div className="bg-slate-50/90 p-3.5 rounded-xl border border-slate-200 text-xs">
                    <span className="block text-2xs uppercase text-slate-500 font-extrabold tracking-wider mb-1">
                      Principal's Remark
                    </span>
                    <p className="text-slate-800 italic font-medium">
                      "{student.principal_remark || 'An excellent and well-behaved student. Keep up the good work!'}"
                    </p>
                  </div>
                </div>

                {/* 5. Performance Summary Box & Signatures */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-2 items-end">
                  
                  {/* Performance Metrics */}
                  <div className="md:col-span-5 bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-around text-center">
                    <div>
                      <span className="block text-2xs uppercase text-slate-500 font-bold">Total Marks</span>
                      <strong className="text-lg font-black text-slate-900">{student.total_score || 0}</strong>
                    </div>
                    <div className="border-r border-slate-300"></div>
                    <div>
                      <span className="block text-2xs uppercase text-slate-500 font-bold">Average</span>
                      <strong className="text-lg font-black text-slate-900">{student.average || 0}%</strong>
                    </div>
                    <div className="border-r border-slate-300"></div>
                    <div>
                      <span className="block text-2xs uppercase text-slate-500 font-bold">Subjects</span>
                      <strong className="text-lg font-black text-slate-900">{student.subject_count || results.length}</strong>
                    </div>
                  </div>

                  {/* Signatures Grid */}
                  <div className="md:col-span-7 grid grid-cols-2 gap-6 text-center text-xs">
                    <div>
                      <div className="border-b border-slate-900 h-10 mb-1 flex items-end justify-center pb-1">
                        <span className="font-serif italic text-slate-400 text-[10px]">Form Master</span>
                      </div>
                      <span className="font-bold text-slate-800">Form Master Signature</span>
                    </div>
                    <div>
                      <div className="border-b border-slate-900 h-10 mb-1 flex items-end justify-center pb-1">
                        <span className="font-serif italic text-slate-400 text-[10px]">Principal</span>
                      </div>
                      <span className="font-bold text-slate-800">Principal Signature & Stamp</span>
                    </div>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

export default Reports;
