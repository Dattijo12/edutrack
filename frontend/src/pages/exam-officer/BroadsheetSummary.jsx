import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  ArrowLeft, 
  FileSpreadsheet, 
  Printer, 
  Filter, 
  Layers, 
  Calendar, 
  GraduationCap, 
  CheckCheck,
  Trophy,
  Award
} from 'lucide-react';
import examOfficerService from '../../services/examOfficerService';
import classService from '../../services/classService';
import { useSchool } from '../../context/SchoolContext';

const BroadsheetSummary = () => {
  const { school } = useSchool();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('1st Term');
  const [selectedSession, setSelectedSession] = useState('2025/2026');

  const [broadsheetData, setBroadsheetData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (school?.active_session) setSelectedSession(school.active_session);
    if (school?.active_term) setSelectedTerm(school.active_term);
    fetchClasses();
  }, [school]);

  /**
   * Fetch available class list for dropdown selector
   */
  const fetchClasses = async () => {
    try {
      const data = await examOfficerService.getClasses();
      const list = Array.isArray(data) ? data : (data?.data || []);
      setClasses(list);
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
   * Fetch Matrix Broadsheet Summary for selected Class, Term, and Session
   */
  const handleGenerateBroadsheet = async (e) => {
    if (e) e.preventDefault();
    if (!selectedClass) {
      toast.warning('Please select a class arm first.');
      return;
    }

    setLoading(true);
    try {
      const data = await examOfficerService.getBroadsheet(selectedClass, selectedTerm, selectedSession);
      console.log('Broadsheet Students Results Payload:', data.students?.[0]?.results);
      setBroadsheetData(data);
      toast.success('Broadsheet Summary generated successfully!');
    } catch (err) {
      console.error('Broadsheet summary generation error:', err);
      toast.error(err?.response?.data?.message || 'Failed to generate broadsheet matrix summary.');
      setBroadsheetData(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Trigger browser print preview for A4 print mode
   */
  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }} className="animate-fade-in min-h-screen">
      
      {/* Header & Filter Controls Panel (Hidden on Print) */}
      <div className="glass-panel no-print mb-8 p-8 rounded-3xl border border-slate-800 bg-slate-900/70 shadow-2xl backdrop-blur-md">
        
        {/* Navigation & Header */}
        <div className="mb-6 pb-6 border-b border-slate-800/80">
          <Link to="/dashboard" className="back-link inline-flex items-center gap-2 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors mb-3">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-inner">
                <FileSpreadsheet size={26} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">Broadsheet Matrix Summary</h1>
                <p className="text-sm text-slate-400 mt-0.5">
                  View aggregated subject scores, totals, averages, and class positions in a matrix format.
                </p>
              </div>
            </div>

            {/* Print Button */}
            {broadsheetData && broadsheetData.students?.length > 0 && (
              <button 
                type="button"
                onClick={handlePrint}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm flex items-center gap-2 transition-all shadow-md active:scale-95"
              >
                <Printer size={16} className="text-cyan-400" /> Print Matrix Broadsheet
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Form */}
        <form onSubmit={handleGenerateBroadsheet} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80">
          
          {/* Class Dropdown */}
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
                <><Filter size={16} /> Generate</>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="page-loading flex flex-col items-center justify-center py-20 text-slate-400">
          <span className="spinner w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mb-4"></span>
          <p className="text-sm font-medium">Fetching class broadsheet matrix data...</p>
        </div>
      ) : !broadsheetData ? (
        <div className="empty-state p-16 text-center rounded-3xl border border-slate-800 bg-slate-900/50 backdrop-blur-md">
          <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto mb-4 text-cyan-400">
            <FileSpreadsheet size={32} />
          </div>
          <h3 className="text-xl font-bold text-slate-100 mb-2">No Broadsheet Generated Yet</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Select a class arm, term, and academic session above, then click <strong className="text-cyan-400">Generate</strong> to load the broadsheet summary matrix.
          </p>
        </div>
      ) : broadsheetData.students?.length === 0 ? (
        <div className="empty-state p-16 text-center rounded-3xl border border-slate-800 bg-slate-900/50 backdrop-blur-md">
          <CheckCheck size={48} className="mx-auto text-emerald-400 opacity-80 mb-3" />
          <h3 className="text-xl font-bold text-slate-100 mb-1">No Approved Results Found</h3>
          <p className="text-slate-400 text-sm">
            There are no student results for {broadsheetData.class?.full_name || 'this class'} in {broadsheetData.term} ({broadsheetData.session}).
          </p>
        </div>
      ) : (
        /* Printable & Responsive Matrix Table Container */
        <div className="printable-area animate-fade-in bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md">
          
          {/* Broadsheet Meta Header */}
          <div className="mb-6 pb-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-wide uppercase">
                {broadsheetData.school?.name || 'School Broadsheet Summary'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Class: <span className="text-cyan-400 font-semibold">{broadsheetData.class?.full_name}</span> | Term: <span className="text-slate-200 font-semibold">{broadsheetData.term}</span> | Session: <span className="text-slate-200 font-semibold">{broadsheetData.session}</span>
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                Total Students: <span className="text-cyan-400 font-bold">{broadsheetData.students.length}</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 font-medium">
                Subjects Offered: <span className="text-cyan-400 font-bold">{broadsheetData.subjects?.length || 0}</span>
              </div>
            </div>
          </div>

          {/* Horizontally Scrollable Matrix Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800/90 shadow-inner">
            <table className="w-full text-left border-collapse text-xs md:text-sm">
              
              {/* Table Headers */}
              <thead>
                <tr className="bg-slate-950 text-slate-300 border-b border-slate-800 font-semibold uppercase tracking-wider text-2xs">
                  <th className="py-3.5 px-4 text-center w-12 border-r border-slate-800">#</th>
                  <th className="py-3.5 px-5 min-w-[180px] border-r border-slate-800">Student Name</th>
                  <th className="py-3.5 px-4 min-w-[120px] border-r border-slate-800 font-mono">Adm No</th>

                  {/* Dynamic Subject Columns */}
                  {broadsheetData.subjects?.map(subject => (
                    <th 
                      key={subject.id} 
                      className="py-3.5 px-3 text-center min-w-[90px] border-r border-slate-800/80 bg-slate-950/80 text-cyan-300 font-bold"
                      title={subject.name}
                    >
                      {subject.code || subject.name}
                    </th>
                  ))}

                  {/* Static Summary Columns */}
                  <th className="py-3.5 px-4 text-center min-w-[100px] border-r border-slate-800 bg-slate-900 text-slate-200">Total</th>
                  <th className="py-3.5 px-4 text-center min-w-[100px] border-r border-slate-800 bg-slate-900 text-slate-200">Average</th>
                  <th className="py-3.5 px-4 text-center min-w-[90px] bg-slate-900 text-cyan-400">Position</th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-800/70 text-slate-200">
                {broadsheetData.students.map((student, idx) => (
                  <tr 
                    key={student.id}
                    className="hover:bg-cyan-950/20 transition-colors bg-slate-900/40 odd:bg-slate-900/80"
                  >
                    {/* # */}
                    <td className="py-3 px-4 text-center text-slate-400 font-medium border-r border-slate-800/80">
                      {idx + 1}
                    </td>

                    {/* Student Name */}
                    <td className="py-3 px-5 font-semibold text-slate-100 border-r border-slate-800/80">
                      {student.name}
                    </td>

                    {/* Admission Number */}
                    <td className="py-3 px-4 font-mono text-xs text-slate-400 border-r border-slate-800/80">
                      {student.admission_number}
                    </td>

                    {/* Dynamic Subject Scores Alignment */}
                    {broadsheetData.subjects?.map(subject => {
                      const res = student.results?.[subject.id] || student.results?.[String(subject.id)];
                      return (
                        <td 
                          key={subject.id} 
                          className="py-3 px-3 text-center border-r border-slate-800/60 font-medium"
                        >
                          {res ? (
                            <div className="inline-flex items-center justify-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-200">
                              <span className="font-bold text-slate-100">{res.total}</span>
                              {res.grade && (
                                <span className="text-xs px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
                                  {res.grade}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-600 font-bold">-</span>
                          )}
                        </td>
                      );
                    })}

                    {/* Total Marks */}
                    <td className="py-3 px-4 text-center font-extrabold text-slate-100 border-r border-slate-800/80 bg-slate-950/30">
                      {student.total_marks}
                    </td>

                    {/* Average Percentage */}
                    <td className="py-3 px-4 text-center font-bold text-slate-200 border-r border-slate-800/80 bg-slate-950/30">
                      {student.average}%
                    </td>

                    {/* Class Position */}
                    <td className="py-3 px-4 text-center font-extrabold text-cyan-400 bg-cyan-950/20">
                      <div className="inline-flex items-center justify-center gap-1">
                        {student.class_position === 1 && <Trophy size={14} className="text-amber-400" />}
                        {student.class_position === 2 && <Award size={14} className="text-slate-300" />}
                        {student.class_position === 3 && <Award size={14} className="text-amber-600" />}
                        <span>{student.class_position_formatted || `${student.class_position}`}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default BroadsheetSummary;
