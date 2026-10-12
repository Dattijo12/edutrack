import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  ArrowLeft, 
  ClipboardList, 
  Send, 
  AlertCircle, 
  Loader2, 
  Upload, 
  Download, 
  AlertTriangle, 
  Pencil, 
  CheckCircle2, 
  X,
  Lock
} from 'lucide-react';
import resultService from '../../services/resultService';
import { useSchool } from '../../context/SchoolContext';
import BulkUploadModal from '../../components/teacher/BulkUploadModal';

/**
 * Grade Scale Helper
 * Maps total score to WAEC/NECO grade scale and color code.
 */
const gradeScale = (score) => {
  if (score >= 75) return { grade: 'A1', color: '#00e676' };
  if (score >= 70) return { grade: 'B2', color: '#69f0ae' };
  if (score >= 65) return { grade: 'B3', color: '#b9f6ca' };
  if (score >= 60) return { grade: 'C4', color: '#00b0ff' };
  if (score >= 55) return { grade: 'C5', color: '#40c4ff' };
  if (score >= 50) return { grade: 'C6', color: '#80d8ff' };
  if (score >= 45) return { grade: 'D7', color: '#ffab40' };
  if (score >= 40) return { grade: 'E8', color: '#ff6d00' };
  return { grade: 'F9', color: '#ff1744' };
};

/**
 * GradebookEntry Component
 * Displays student score entry table for Subject Teachers.
 * Enforces Read-Only mode when active ResultWindow is closed.
 */
const GradebookEntry = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { school } = useSchool();

  // Dropdowns data
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);
  const [dropdownError, setDropdownError] = useState(null);

  // Student table data
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentError, setStudentError] = useState(null);

  // Selections
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [term, setTerm] = useState('1');
  const [session, setSession] = useState('2025/2026');

  // Result Window Status (Time-Bound Restriction Access Control)
  const [isWindowOpen, setIsWindowOpen] = useState(true);
  const [resultWindows, setResultWindows] = useState([]);

  // Scores: { [studentId]: { ca: string, exam: string } }
  const [scores, setScores] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [rejectedAlerts, setRejectedAlerts] = useState([]);

  // Edit Correction Modal state for resubmitting rejected results
  const [editingResult, setEditingResult] = useState(null);
  const [editCa, setEditCa] = useState('');
  const [editExam, setEditExam] = useState('');
  const [submittingCorrection, setSubmittingCorrection] = useState(false);

  // Fetch active result windows status from backend
  const fetchWindowStatus = useCallback(async () => {
    try {
      const windows = await resultService.getResultWindows();
      if (Array.isArray(windows)) {
        setResultWindows(windows);
        
        // Find matching window for selected session and term
        const termLabel = term === '1' ? '1st Term' : term === '2' ? '2nd Term' : term === '3' ? '3rd Term' : term;
        const matchingWindow = windows.find(
          (w) => w.academic_session === session && (w.term === term || w.term === termLabel)
        );

        if (matchingWindow) {
          setIsWindowOpen(Boolean(matchingWindow.is_open));
        } else {
          // If any window is explicitly set to open, check open status
          const hasOpenWindow = windows.some((w) => w.is_open);
          setIsWindowOpen(windows.length === 0 || hasOpenWindow);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch result windows, defaulting to open:', err);
    }
  }, [session, term]);

  // Fetch teacher's rejected result notifications
  const fetchAlerts = useCallback(async () => {
    try {
      const res = await resultService.getRejectedResults();
      setRejectedAlerts(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Failed to fetch rejected score alerts:', err);
    }
  }, []);

  // Load configuration, dropdowns, and window status on mount
  useEffect(() => {
    const loadDropdowns = async () => {
      setLoadingDropdowns(true);
      setDropdownError(null);
      try {
        const [classesData, subjectsData] = await Promise.all([
          resultService.getClasses(),
          resultService.getSubjects(),
        ]);
        setClasses(Array.isArray(classesData) ? classesData : []);
        setSubjects(Array.isArray(subjectsData) ? subjectsData : []);

        const urlClass = searchParams.get('class');
        const urlSubject = searchParams.get('subject');
        if (urlClass) setSelectedClass(urlClass);
        if (urlSubject) setSelectedSubject(urlSubject);
      } catch (err) {
        console.error('Failed to load dropdown data:', err);
        setDropdownError('Failed to load classes and subjects. Please refresh the page.');
      } finally {
        setLoadingDropdowns(false);
      }
    };

    loadDropdowns();
    fetchAlerts();
  }, [fetchAlerts, searchParams]);

  // Re-verify window status whenever session or term changes
  useEffect(() => {
    fetchWindowStatus();
  }, [fetchWindowStatus, session, term]);

  // Open correction modal for a specific rejected result
  const handleOpenEditCorrection = (res) => {
    if (!isWindowOpen) {
      toast.error('Result window is closed. Grade submission is forbidden.');
      return;
    }
    setEditingResult(res);
    setEditCa(res.ca_score !== null && res.ca_score !== undefined ? String(res.ca_score) : '');
    setEditExam(res.exam_score !== null && res.exam_score !== undefined ? String(res.exam_score) : '');
  };

  // Submit corrected scores for a single rejected result via PUT /teacher/results/{id}
  const handleSaveCorrection = async (e) => {
    if (e) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }
    if (!editingResult) return;

    if (!isWindowOpen) {
      toast.error('Result window is closed. Grade submission is forbidden.');
      return;
    }

    const ca = parseFloat(editCa) || 0;
    const exam = parseFloat(editExam) || 0;

    const maxCa = school?.max_ca_score || 30;
    const maxExam = school?.max_exam_score || 70;

    if (ca < 0 || ca > maxCa) {
      toast.error(`CA score must be between 0 and ${maxCa}.`);
      return;
    }
    if (exam < 0 || exam > maxExam) {
      toast.error(`Exam score must be between 0 and ${maxExam}.`);
      return;
    }

    try {
      setSubmittingCorrection(true);
      await resultService.updateResult(editingResult.id, {
        ca_score: ca,
        exam_score: exam,
      });

      toast.success('Corrected score entry resubmitted for approval successfully!');
      setEditingResult(null);
      await fetchAlerts();
    } catch (err) {
      console.error('Failed to update result:', err);
      if (err?.response?.status === 403) {
        setIsWindowOpen(false);
        toast.error('Result window is closed. Grade submission is forbidden.');
      } else {
        const msg = err?.response?.data?.message || 'Failed to update result entry.';
        toast.error(msg);
      }
    } finally {
      setSubmittingCorrection(false);
    }
  };

  // Load students whenever selectedClass changes
  const fetchStudents = useCallback(async (classId) => {
    if (!classId) {
      setStudents([]);
      setStudentError(null);
      return;
    }
    setLoadingStudents(true);
    setStudentError(null);
    setStudents([]);
    try {
      const data = await resultService.getStudents(classId);
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load students:', err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to load students for selected class.';
      setStudentError(msg);
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents(selectedClass);
  }, [selectedClass, fetchStudents]);

  // Pre-fill scores for flagged/rejected students when roster or alerts change
  useEffect(() => {
    if (students.length > 0 && selectedSubject && rejectedAlerts.length > 0) {
      setScores((prev) => {
        const next = { ...prev };
        students.forEach((s) => {
          const rejected = rejectedAlerts.find(
            (r) => Number(r.student_id) === Number(s.id) && Number(r.subject_id) === Number(selectedSubject)
          );
          if (rejected && !next[s.id]) {
            next[s.id] = {
              ca: rejected.ca_score !== null && rejected.ca_score !== undefined ? String(rejected.ca_score) : '',
              exam: rejected.exam_score !== null && rejected.exam_score !== undefined ? String(rejected.exam_score) : '',
            };
          }
        });
        return next;
      });
    }
  }, [students, selectedSubject, rejectedAlerts]);

  const handleClassChange = (e) => {
    setSelectedClass(e.target.value);
    setScores({});
  };

  const handleScoreChange = (studentId, field, value) => {
    if (!isWindowOpen) return;
    setScores((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
  };

  const calculateTotal = (studentId) => {
    const entry = scores[studentId] || {};
    const ca = parseFloat(entry.ca) || 0;
    const exam = parseFloat(entry.exam) || 0;
    return ca + exam;
  };

  const handleSubmit = async () => {
    if (!isWindowOpen) {
      toast.error('Result window is closed. Grade submission is forbidden.');
      return;
    }
    if (!selectedClass || !selectedSubject || !term || !session) {
      toast.error('Please select a Class, Subject, Term, and Academic Session before submitting.');
      return;
    }
    if (students.length === 0) {
      toast.error('No students found in the selected class.');
      return;
    }

    try {
      setSubmitting(true);
      let successCount = 0;
      for (const s of students) {
        const entry = scores[s.id] || {};
        const ca = parseFloat(entry.ca) || 0;
        const exam = parseFloat(entry.exam) || 0;
        const total = ca + exam;
        const { grade } = gradeScale(total);

        const existingRejected = rejectedAlerts.find(
          (r) => Number(r.student_id) === Number(s.id) && Number(r.subject_id) === Number(selectedSubject)
        );

        try {
          if (existingRejected) {
            await resultService.updateResult(existingRejected.id, {
              ca_score: ca,
              exam_score: exam,
            });
          } else {
            await resultService.createResult({
              student_id: s.id,
              subject_id: Number(selectedSubject),
              term,
              academic_session: session,
              ca_score: ca,
              exam_score: exam,
              total_score: total,
              grade,
            });
          }
          successCount++;
        } catch (err) {
          if (err?.response?.status === 403) {
            setIsWindowOpen(false);
            toast.error('Result window is closed. Grade submission is forbidden.');
            break;
          }
          const studentName = s.name || `${s.first_name || ''} ${s.last_name || ''}` || 'Unknown';
          const errMsg =
            err?.response?.data?.message ||
            (err?.response?.data && typeof err.response.data === 'object'
              ? Object.values(err.response.data).flat().join('; ')
              : null) ||
            `Failed to submit result for ${studentName}.`;
          toast.error(errMsg);
        }
      }
      if (successCount > 0) {
        toast.success(`${successCount} of ${students.length} student grade(s) submitted for approval!`);
        await fetchAlerts();
        setTimeout(() => navigate('/dashboard'), 1800);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Render loading state for dropdowns
  if (loadingDropdowns) {
    return (
      <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }} className="animate-fade-in">
        <div className="glass-panel" style={{ padding: '40px' }}>
          <div className="page-loading">
            <span className="spinner"></span>
            <p>Loading gradebook configuration...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }} className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '40px' }}>

        {/* Page Header */}
        <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-dark)', paddingBottom: '20px' }}>
          <button
            onClick={() => navigate(-1)}
            className="back-link"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </button>
          
          <div className="flex items-center justify-between mt-3">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ClipboardList className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                Teacher Gradebook Entry
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Select class and subject to record or update CA & Exam scores for your students.
              </p>
            </div>

            {/* Read-Only Status Indicator Badge */}
            {!isWindowOpen && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 shadow-sm">
                <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                Read-Only Mode Active
              </span>
            )}
          </div>
        </div>

        {/* Prominent Warning Banner when ResultWindow is closed */}
        {!isWindowOpen && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 flex items-start gap-3.5 text-amber-900 dark:text-amber-200 shadow-sm animate-in fade-in">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-amber-900 dark:text-amber-100">
                Read-Only Mode: The result window is currently closed by the Super Admin.
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5">
                Existing scores remain visible for transparency and review, but all score input fields and submission actions are locked.
              </p>
            </div>
          </div>
        )}

        {/* Rejection Notification Banner */}
        {rejectedAlerts.length > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200 shadow-sm">
            <div className="flex items-center gap-2 font-bold text-sm text-rose-900 dark:text-rose-100 mb-2">
              <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              Action Required: {rejectedAlerts.length} Score Entry Record(s) Flagged for Correction
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {rejectedAlerts.map((res) => (
                <div 
                  key={res.id} 
                  className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-rose-200 dark:border-rose-900/60 text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {res.student?.name || `${res.student?.first_name || ''} ${res.student?.last_name || ''}`.trim() || 'Student'}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400"> • {res.subject?.name} ({res.school_class?.name || res.student?.class?.name})</span>
                    <p className="text-rose-700 dark:text-rose-300 mt-0.5 font-medium">Reason: {res.rejection_reason}</p>
                  </div>
                  <button
                    disabled={!isWindowOpen}
                    onClick={() => handleOpenEditCorrection(res)}
                    className="px-3 py-1 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition-colors flex items-center gap-1 shrink-0 ml-3"
                  >
                    <Pencil className="w-3 h-3" /> Correct
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dropdown Filters & Actions Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Class
            </label>
            <select
              value={selectedClass}
              onChange={handleClassChange}
              className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Select Class --</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.arm || ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Select Subject --</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code || s.subject_code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Term
            </label>
            <select
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="1">1st Term</option>
              <option value="2">2nd Term</option>
              <option value="3">3rd Term</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Academic Session
            </label>
            <select
              value={session}
              onChange={(e) => setSession(e.target.value)}
              className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
            >
              <option value="2025/2026">2025/2026</option>
              <option value="2024/2025">2024/2025</option>
            </select>
          </div>
        </div>

        {/* Action Buttons: Template Download & Bulk CSV Upload */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-6 border-b border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => resultService.downloadTemplate(selectedClass)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl transition-colors inline-flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Download Template CSV
          </button>

          <button
            type="button"
            disabled={!isWindowOpen || !selectedClass || !selectedSubject}
            onClick={() => setIsBulkModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all inline-flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" /> Bulk Upload CSV Scores
          </button>
        </div>

        {/* Student Score Entry Data Table */}
        {loadingStudents ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-600" />
            Loading class roster...
          </div>
        ) : !selectedClass ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
            Please select a class to display the student score entry table.
          </div>
        ) : students.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
            No students found in the selected class.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-700 text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 font-bold">
                  <th className="px-6 py-3.5">Admission No</th>
                  <th className="px-6 py-3.5">Student Name</th>
                  <th className="px-6 py-3.5 w-32">CA Score ({school?.max_ca_score || 30})</th>
                  <th className="px-6 py-3.5 w-32">Exam Score ({school?.max_exam_score || 70})</th>
                  <th className="px-6 py-3.5 w-28 text-center">Total (100)</th>
                  <th className="px-6 py-3.5 w-24 text-center">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {students.map((student) => {
                  const studentName = student.name || `${student.first_name || ''} ${student.last_name || ''}`.trim() || 'Student';
                  const entry = scores[student.id] || {};
                  const caVal = entry.ca || '';
                  const examVal = entry.exam || '';
                  const total = calculateTotal(student.id);
                  const { grade, color } = gradeScale(total);

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                        {student.admission_number}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                        {studentName}
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          min="0"
                          max={school?.max_ca_score || 30}
                          value={caVal}
                          disabled={!isWindowOpen || submitting}
                          onChange={(e) => handleScoreChange(student.id, 'ca', e.target.value)}
                          placeholder="0"
                          className="w-full p-2 text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          min="0"
                          max={school?.max_exam_score || 70}
                          value={examVal}
                          disabled={!isWindowOpen || submitting}
                          onChange={(e) => handleScoreChange(student.id, 'exam', e.target.value)}
                          placeholder="0"
                          className="w-full p-2 text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-slate-900 dark:text-white">
                        {total}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span 
                          className="inline-block px-2.5 py-1 rounded-md text-xs font-black shadow-sm"
                          style={{ backgroundColor: `${color}20`, color: color, border: `1px solid ${color}40` }}
                        >
                          {grade}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Submit Grades Footer Button */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            disabled={!isWindowOpen || submitting || students.length === 0}
            onClick={handleSubmit}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-sm transition-all inline-flex items-center gap-2 text-sm"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Submitting Grades...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" /> Submit Grades for Approval
              </>
            )}
          </button>
        </div>

      </div>

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        subjectId={selectedSubject}
        term={term}
        academicSession={session}
        onUploadSuccess={() => {
          fetchStudents(selectedClass);
          fetchAlerts();
        }}
      />

      {/* Edit Correction Modal */}
      {editingResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <Pencil className="w-5 h-5 text-indigo-600" />
                Resubmit Flagged Score
              </h3>
              <button onClick={() => setEditingResult(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Student: <strong>{editingResult.student?.name || editingResult.student?.first_name}</strong> • Subject: <strong>{editingResult.subject?.name}</strong>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  CA Score ({school?.max_ca_score || 30})
                </label>
                <input
                  type="number"
                  value={editCa}
                  disabled={!isWindowOpen}
                  onChange={(e) => setEditCa(e.target.value)}
                  className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 dark:text-slate-300 mb-1">
                  Exam Score ({school?.max_exam_score || 70})
                </label>
                <input
                  type="number"
                  value={editExam}
                  disabled={!isWindowOpen}
                  onChange={(e) => setEditExam(e.target.value)}
                  className="w-full p-2.5 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl"
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingResult(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!isWindowOpen || submittingCorrection}
                onClick={handleSaveCorrection}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5"
              >
                {submittingCorrection ? 'Resubmitting...' : 'Save & Resubmit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradebookEntry;
