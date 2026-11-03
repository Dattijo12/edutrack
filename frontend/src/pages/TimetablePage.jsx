import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  Printer,
  BookOpen,
  User,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
  X,
  Save,
  Filter,
  GraduationCap,
  Layers,
  ChevronRight,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSchool } from '../context/SchoolContext';
import timetableService from '../services/timetableService';
import classService from '../services/classService';
import subjectService from '../services/subjectService';
import adminService from '../services/adminService';

/**
 * Standard weekdays supported by the timetable scheduler.
 */
const DEFAULT_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

/**
 * Helper to compute period duration in minutes from HH:MM strings.
 */
const computeDurationMinutes = (start, end) => {
  if (!start || !end) return 0;
  const [sH, sM] = start.split(':').map(Number);
  const [eH, eM] = end.split(':').map(Number);
  return (eH * 60 + eM) - (sH * 60 + sM);
};

/**
 * Format 24-hour time string (e.g. "08:30" or "08:30:00") into friendly 12-hour AM/PM format.
 */
const formatTimeAmPm = (timeStr) => {
  if (!timeStr) return '';
  const [hours, minutes] = timeStr.split(':');
  const h = parseInt(hours, 10);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayHours = h % 12 || 12;
  return `${displayHours}:${minutes} ${period}`;
};

/**
 * TimetablePage Component
 * Provides a responsive, role-aware Class Timetable viewer and scheduler.
 * 
 * - Administrators & Principals: View any class, schedule slots with conflict validation, delete slots.
 * - Teachers & Form Masters: Browse class schedules in read-only mode.
 * - Students: Securely locked to their assigned class roster with zero exposure to management controls.
 */
const TimetablePage = () => {
  const { user } = useAuth();
  const { school } = useSchool();
  const navigate = useNavigate();
  const location = useLocation();

  // Fallback student profile from localStorage if user is student
  const storedStudent = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('student') || '{}');
    } catch (_e) {
      return {};
    }
  }, []);

  // Determine role capabilities
  const isStudent = user?.role === 'student' || Boolean(storedStudent?.id && !user?.role);
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isStaff = ['admin', 'super_admin', 'teacher', 'form_master', 'exam_officer'].includes(user?.role);

  // Class selection state
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(
    isStudent ? (user?.class_id || storedStudent?.class_id || '') : ''
  );
  const [selectedClassObj, setSelectedClassObj] = useState(null);

  // Timetable records & loading states
  const [timetableEntries, setTimetableEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState('Monday');

  // Admin slot creation modal state
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [conflictError, setConflictError] = useState(null);

  // Form options data
  const [subjectsList, setSubjectsList] = useState([]);
  const [teachersList, setTeachersList] = useState([]);

  // Slot Form State
  const [formData, setFormData] = useState({
    subject_id: '',
    teacher_id: '',
    day_of_week: 'Monday',
    start_time: '08:00',
    end_time: '09:00',
  });

  // Deletion confirmation state
  const [deletingId, setDeletingId] = useState(null);
  const [slotToDelete, setSlotToDelete] = useState(null);

  /**
   * 1. Initialize Classes list for Staff/Admin selector
   */
  useEffect(() => {
    if (isStudent) {
      // Student is locked to their assigned class
      const studentClassId = user?.class_id || storedStudent?.class_id;
      if (studentClassId) {
        setSelectedClassId(studentClassId);
      }
      return;
    }

    const loadClasses = async () => {
      try {
        const data = await timetableService.getClassesForSelector(user?.role);
        setClasses(data);
        if (data.length > 0 && !selectedClassId) {
          setSelectedClassId(data[0].id);
        }
      } catch (err) {
        console.error('Failed to load classes for timetable:', err);
        toast.error('Unable to load classes for selection.');
      }
    };

    loadClasses();
  }, [isStudent, user?.role, user?.class_id, storedStudent?.class_id]);

  /**
   * 2. Load form selection dependencies (Subjects & Teachers) for Admin
   */
  useEffect(() => {
    if (!isAdmin) return;

    const loadFormOptions = async () => {
      try {
        const [subjectsData, teachersData] = await Promise.all([
          timetableService.getSubjects(),
          timetableService.getTeachers(),
        ]);
        setSubjectsList(subjectsData);
        setTeachersList(teachersData);
      } catch (err) {
        console.error('Failed to load subjects or teachers:', err);
      }
    };

    loadFormOptions();
  }, [isAdmin]);

  /**
   * 3. Fetch timetable for the currently selected class
   */
  const fetchTimetable = useCallback(async (classId) => {
    if (!classId) return;

    setLoading(true);
    try {
      const response = await timetableService.getClassTimetable(classId);
      setTimetableEntries(response.data || []);
      if (response.class) {
        setSelectedClassObj(response.class);
      }
    } catch (err) {
      console.error('Error fetching timetable:', err);
      const msg = err?.response?.data?.message || 'Failed to load timetable for selected class.';
      toast.error(msg);
      setTimetableEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      fetchTimetable(selectedClassId);
    }
  }, [selectedClassId, fetchTimetable]);

  /**
   * Days to display: defaults to Mon-Fri, adds Saturday if any entry exists on Saturday
   */
  const availableDays = useMemo(() => {
    const hasSaturday = timetableEntries.some((entry) => entry.day_of_week === 'Saturday');
    return hasSaturday ? [...DEFAULT_DAYS, 'Saturday'] : DEFAULT_DAYS;
  }, [timetableEntries]);

  // Ensure active day stays within available days
  useEffect(() => {
    if (!availableDays.includes(activeDay)) {
      setActiveDay('Monday');
    }
  }, [availableDays, activeDay]);

  /**
   * Entries filtered for the currently active day tab, ordered by start time
   */
  const activeDayEntries = useMemo(() => {
    return timetableEntries
      .filter((entry) => entry.day_of_week === activeDay)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [timetableEntries, activeDay]);

  /**
   * Count of slots per day of the week
   */
  const slotsCountByDay = useMemo(() => {
    const counts = {};
    availableDays.forEach((day) => {
      counts[day] = timetableEntries.filter((e) => e.day_of_week === day).length;
    });
    return counts;
  }, [availableDays, timetableEntries]);

  /**
   * Open the "+ Add Slot" modal
   */
  const handleOpenAddModal = () => {
    setConflictError(null);
    setFormData({
      subject_id: subjectsList[0]?.id || '',
      teacher_id: teachersList[0]?.id || '',
      day_of_week: activeDay,
      start_time: '08:00',
      end_time: '09:00',
    });
    setShowModal(true);
  };

  /**
   * Close the slot modal
   */
  const handleCloseModal = () => {
    setShowModal(false);
    setConflictError(null);
  };

  /**
   * Handle slot submission with backend 422 conflict handling
   */
  const handleSubmitSlot = async (e) => {
    e.preventDefault();
    setConflictError(null);

    if (!selectedClassId) {
      toast.error('Please select a school class first.');
      return;
    }

    if (formData.start_time >= formData.end_time) {
      setConflictError('End time must be strictly after the start time.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        school_class_id: parseInt(selectedClassId, 10),
        subject_id: parseInt(formData.subject_id, 10),
        teacher_id: parseInt(formData.teacher_id, 10),
        day_of_week: formData.day_of_week,
        start_time: formData.start_time,
        end_time: formData.end_time,
      };

      await timetableService.createTimetableSlot(payload);
      toast.success('Timetable period scheduled successfully!');
      handleCloseModal();
      // Refresh current class timetable
      fetchTimetable(selectedClassId);
    } catch (err) {
      console.warn('Timetable creation conflict or error:', err);
      const res = err?.response?.data;

      if (err?.response?.status === 422) {
        // Backend double-booking conflict detected
        const conflictMessage = res?.message || 'Scheduling conflict detected. Please verify room and teacher availability.';
        setConflictError(conflictMessage);
        toast.error(conflictMessage);
      } else {
        const errorMsg = res?.message || 'An error occurred while creating the timetable slot.';
        setConflictError(errorMsg);
        toast.error(errorMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Trigger slot deletion confirmation
   */
  const confirmDeleteSlot = (slot) => {
    setSlotToDelete(slot);
  };

  /**
   * Execute timetable slot deletion
   */
  const handleDeleteSlot = async () => {
    if (!slotToDelete) return;

    setDeletingId(slotToDelete.id);
    try {
      await timetableService.deleteTimetableSlot(slotToDelete.id);
      toast.success('Timetable entry deleted successfully.');
      setTimetableEntries((prev) => prev.filter((item) => item.id !== slotToDelete.id));
      setSlotToDelete(null);
    } catch (err) {
      console.error('Failed to delete timetable slot:', err);
      toast.error(err?.response?.data?.message || 'Failed to delete timetable slot.');
    } finally {
      setDeletingId(null);
    }
  };

  /**
   * Handle browser native printing with print-specific layout optimization
   */
  const handlePrint = () => {
    window.print();
  };

  // Find active class display text
  const currentClassName = selectedClassObj
    ? `${selectedClassObj.name} ${selectedClassObj.arm || ''}`.trim()
    : classes.find((c) => String(c.id) === String(selectedClassId))
    ? `${classes.find((c) => String(c.id) === String(selectedClassId)).name} ${classes.find((c) => String(c.id) === String(selectedClassId)).arm || ''}`.trim()
    : storedStudent?.class?.name || 'Class Timetable';

  return (
    <div className="space-y-6">
      {/* Print-Only Header Banner */}
      <div className="hidden print:block text-center pb-4 border-b border-slate-300">
        <h1 className="text-2xl font-black tracking-tight">{school?.name || 'EduTrack Academy'}</h1>
        <p className="text-sm text-slate-600 font-medium">Official Class Academic Timetable</p>
        <div className="text-xs font-semibold mt-1">
          Class: <span className="font-bold underline">{currentClassName}</span> • Academic Session: {school?.academic_session || '2025/2026'}
        </div>
      </div>

      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {isStudent && (
              <button
                type="button"
                onClick={() => navigate('/student/dashboard')}
                className="text-xs font-semibold text-indigo-500 hover:text-indigo-400 flex items-center gap-1 mr-2 transition-colors"
              >
                <ArrowLeft size={14} /> Back to Dashboard
              </button>
            )}
            <span className="badge" style={{ background: 'rgba(92, 124, 250, 0.15)', color: '#7b93ff', border: '1px solid rgba(92, 124, 250, 0.3)' }}>
              <Calendar size={12} className="inline mr-1" /> Academic Schedule
            </span>
          </div>
          <h1 className="page-title text-2xl font-bold flex items-center gap-2">
            Class Timetable
            <span className="text-sm font-normal text-slate-400">({currentClassName})</span>
          </h1>
          <p className="page-subtitle text-xs text-slate-400 mt-0.5">
            {isStudent
              ? 'Your weekly lecture hours, course assignments, and assigned instructors.'
              : 'Weekly instructional periods, classroom allocation, and teacher schedule roster.'}
          </p>
        </div>

        {/* Action Controls: Class Selector (Staff), Add Slot (Admin), Print */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Class Selector Dropdown for Staff and Admins */}
          {!isStudent && (
            <div className="flex items-center gap-1.5">
              <label htmlFor="class-selector" className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                <Filter size={13} /> Class:
              </label>
              <select
                id="class-selector"
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="glass-input text-xs font-semibold py-2 px-3 rounded-xl border border-slate-700 bg-slate-900/60 focus:ring-2 focus:ring-indigo-500"
              >
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id} className="bg-slate-900 text-white">
                    {cls.name} {cls.arm ? `(Arm ${cls.arm})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            className="btn-secondary px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
            title="Print or Export PDF Timetable"
          >
            <Printer size={15} />
            <span>Print Timetable</span>
          </button>

          {/* Admin Schedule Creation Button */}
          {isAdmin && (
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="btn-primary px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all"
            >
              <Plus size={16} />
              <span>Add Timetable Slot</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Glassmorphic Schedule Container */}
      <div className="glass-panel p-6 rounded-2xl shadow-xl space-y-6">
        {/* Day-of-Week Navigation Tabs (Screen view only) */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto print:hidden">
          {availableDays.map((day) => {
            const isActive = activeDay === day;
            const count = slotsCountByDay[day] || 0;
            return (
              <button
                key={day}
                type="button"
                onClick={() => setActiveDay(day)}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-md shadow-indigo-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{day}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-semibold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-white/5 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Loading Spinner State */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-semibold">Loading class schedule...</p>
          </div>
        ) : (
          <>
            {/* Screen View: Active Day Slots Grid */}
            <div className="print:hidden">
              {activeDayEntries.length === 0 ? (
                /* Empty Day State */
                <div className="text-center py-16 px-4 space-y-3">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Clock size={28} />
                  </div>
                  <h3 className="text-base font-bold text-slate-200">No scheduled periods for {activeDay}</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    {isAdmin
                      ? `There are currently no instructional subject slots allocated for this class on ${activeDay}. Click the button below to schedule one.`
                      : `No classes are scheduled on ${activeDay} for this class.`}
                  </p>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={handleOpenAddModal}
                      className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl mt-2"
                    >
                      <Plus size={14} /> Schedule a Period
                    </button>
                  )}
                </div>
              ) : (
                /* Schedule Slots Timeline / Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeDayEntries.map((slot) => {
                    const duration = computeDurationMinutes(slot.start_time, slot.end_time);
                    const isDeletingThis = deletingId === slot.id;

                    return (
                      <div
                        key={slot.id}
                        className="bg-white/5 hover:bg-white/[0.08] border border-white/10 hover:border-indigo-500/40 rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between group shadow-sm"
                      >
                        {/* Top: Time Pill & Category */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 font-mono">
                            <Clock size={13} />
                            <span>
                              {formatTimeAmPm(slot.start_time)} – {formatTimeAmPm(slot.end_time)}
                            </span>
                          </div>

                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-white/10 text-slate-300">
                            {duration > 0 ? `${duration} min` : 'Period'}
                          </span>
                        </div>

                        {/* Middle: Subject Info */}
                        <div className="space-y-1 mb-4">
                          <div className="flex items-center gap-1.5">
                            <BookOpen size={15} className="text-indigo-400 shrink-0" />
                            <h4 className="text-sm font-bold text-white tracking-tight line-clamp-1">
                              {slot.subject?.name || 'Unassigned Subject'}
                            </h4>
                          </div>

                          <div className="flex items-center gap-2 pl-5 text-xs text-slate-400">
                            <span className="font-mono text-[11px] text-slate-400">
                              {slot.subject?.code || 'N/A'}
                            </span>
                            {slot.subject?.category && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-indigo-900/40 text-indigo-200 border border-indigo-700/50">
                                {slot.subject.category}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Bottom: Teacher info & Admin Delete action */}
                        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-slate-300">
                            <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                              <User size={13} />
                            </div>
                            <span className="font-medium text-slate-300 line-clamp-1">
                              {slot.teacher?.name || 'Teaching Staff'}
                            </span>
                          </div>

                          {/* Admin Slot Deletion */}
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => confirmDeleteSlot(slot)}
                              disabled={isDeletingThis}
                              className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
                              title="Delete timetable slot"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Print View: Full Weekly Schedule Grid across all days */}
            <div className="hidden print:block space-y-6">
              {availableDays.map((day) => {
                const daySlots = timetableEntries
                  .filter((e) => e.day_of_week === day)
                  .sort((a, b) => a.start_time.localeCompare(b.start_time));

                return (
                  <div key={day} className="page-break-inside-avoid">
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 pb-1 mb-2 border-b-2 border-slate-800 flex justify-between">
                      <span>{day}</span>
                      <span className="text-xs font-normal text-slate-600">{daySlots.length} periods</span>
                    </h3>

                    {daySlots.length === 0 ? (
                      <p className="text-xs italic text-slate-500 py-1 pl-2">No scheduled periods.</p>
                    ) : (
                      <table className="w-full text-xs text-left border-collapse border border-slate-300 mb-4">
                        <thead>
                          <tr className="bg-slate-100 text-slate-800">
                            <th className="border border-slate-300 px-3 py-1.5 font-bold w-36">Time Slot</th>
                            <th className="border border-slate-300 px-3 py-1.5 font-bold">Subject</th>
                            <th className="border border-slate-300 px-3 py-1.5 font-bold w-24">Code</th>
                            <th className="border border-slate-300 px-3 py-1.5 font-bold">Instructor</th>
                          </tr>
                        </thead>
                        <tbody>
                          {daySlots.map((s) => (
                            <tr key={s.id}>
                              <td className="border border-slate-300 px-3 py-1.5 font-mono font-semibold">
                                {formatTimeAmPm(s.start_time)} – {formatTimeAmPm(s.end_time)}
                              </td>
                              <td className="border border-slate-300 px-3 py-1.5 font-bold text-slate-900">
                                {s.subject?.name}
                              </td>
                              <td className="border border-slate-300 px-3 py-1.5 font-mono text-slate-600">
                                {s.subject?.code}
                              </td>
                              <td className="border border-slate-300 px-3 py-1.5 text-slate-800">
                                {s.teacher?.name}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Admin Slot Creation Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content animate-slide-up max-w-lg w-full p-6 space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Calendar size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Add Timetable Slot</h2>
                  <p className="text-xs text-slate-400">Class: {currentClassName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Conflict Alert Banner (422 double-booking feedback) */}
            {conflictError && (
              <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-shake">
                <AlertTriangle size={18} className="shrink-0 text-rose-400 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block">Scheduling Conflict Detected:</span>
                  <p className="leading-relaxed">{conflictError}</p>
                </div>
              </div>
            )}

            {/* Creation Form */}
            <form onSubmit={handleSubmitSlot} className="space-y-4">
              {/* Subject Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Academic Subject *
                </label>
                <select
                  required
                  value={formData.subject_id}
                  onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                  className="glass-input w-full p-2.5 text-xs rounded-xl border border-slate-700 bg-slate-900 text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="" disabled>-- Select Subject --</option>
                  {subjectsList.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code}) {sub.category ? `• ${sub.category}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assigned Teacher */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Assigned Instructor *
                </label>
                <select
                  required
                  value={formData.teacher_id}
                  onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                  className="glass-input w-full p-2.5 text-xs rounded-xl border border-slate-700 bg-slate-900 text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="" disabled>-- Select Teacher --</option>
                  {teachersList.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.role || 'Staff'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Day of Week */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Day of Week *
                </label>
                <select
                  required
                  value={formData.day_of_week}
                  onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                  className="glass-input w-full p-2.5 text-xs rounded-xl border border-slate-700 bg-slate-900 text-white focus:ring-2 focus:ring-indigo-500"
                >
                  {availableDays.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              {/* Time Slots (Start Time & End Time) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="glass-input w-full p-2.5 text-xs rounded-xl border border-slate-700 bg-slate-900 text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    End Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="glass-input w-full p-2.5 text-xs rounded-xl border border-slate-700 bg-slate-900 text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Conflict Prevention Tip */}
              <p className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                <Info size={13} className="text-indigo-400 shrink-0" />
                The system automatically prevents room or instructor double-booking for the selected time window.
              </p>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-cancel px-4 py-2 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary px-5 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5"
                >
                  {submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Validating Schedule...</span>
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      <span>Save Timetable Slot</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {slotToDelete && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content animate-slide-up max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Trash2 size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Delete Timetable Slot?</h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to remove <span className="text-white font-semibold">{slotToDelete.subject?.name}</span> scheduled on {slotToDelete.day_of_week} ({formatTimeAmPm(slotToDelete.start_time)} – {formatTimeAmPm(slotToDelete.end_time)})?
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSlotToDelete(null)}
                className="btn-cancel px-4 py-2 text-xs font-semibold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSlot}
                disabled={deletingId !== null}
                className="btn-delete px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-1.5"
              >
                {deletingId !== null ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetablePage;
