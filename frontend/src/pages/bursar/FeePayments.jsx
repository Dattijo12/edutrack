import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  ArrowLeft, 
  DollarSign, 
  Receipt, 
  Printer, 
  CreditCard, 
  Calendar, 
  GraduationCap, 
  User, 
  CheckCircle2, 
  Hash, 
  Search, 
  Sparkles,
  X,
  Layers,
  Filter,
  ShieldCheck,
  School
} from 'lucide-react';
import bursarService from '../../services/bursarService';

import { useSchool } from '../../context/SchoolContext';

const FeePayments = () => {
  const { school } = useSchool();
  const [students, setStudents] = useState([]);
  const [allClasses, setAllClasses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  
  // Cascading Dropdown: Form Class Selection (separate from filter)
  const [formClassId, setFormClassId] = useState('');

  // Comprehensive Filter State (Search, Class, Term, Session, Status)
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState('ALL');
  const [filterTerm, setFilterTerm] = useState('ALL');
  const [filterSession, setFilterSession] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Receipt Modal State
  const [activeReceipt, setActiveReceipt] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    student_id: '',
    amount_paid: '',
    term: '1st Term',
    academic_session: '2025/2026',
    payment_method: 'Cash',
    reference_number: ''
  });

  useEffect(() => {
    if (school?.active_session) {
      setFormData(prev => ({ ...prev, academic_session: school.active_session }));
    }
    if (school?.active_term) {
      setFormData(prev => ({ ...prev, term: school.active_term }));
    }
    fetchClasses();
    fetchPayments();
  }, [school]);

  /**
   * Cascading: When formClassId changes, fetch students for that class only
   */
  useEffect(() => {
    if (formClassId) {
      fetchStudentsByClass(formClassId);
    } else {
      setStudents([]);
      setFormData(prev => ({ ...prev, student_id: '' }));
    }
  }, [formClassId]);

  /**
   * Fetch COMPLETE list of school classes from backend for dropdown filters and form
   */
  const fetchClasses = async () => {
    try {
      const res = await bursarService.getClasses();
      const classList = Array.isArray(res) ? res : (res?.data || []);
      setAllClasses(classList);
    } catch (err) {
      console.error('Failed to load classes for Bursar:', err);
      toast.error('Could not load class list. Please contact admin.');
    }
  };

  /**
   * Fetch students filtered by a specific class ID (cascading dropdown)
   */
  const fetchStudentsByClass = async (classId) => {
    setLoadingStudents(true);
    setStudents([]);
    setFormData(prev => ({ ...prev, student_id: '' }));
    try {
      const res = await bursarService.getStudentsByClass(classId);
      const studentList = Array.isArray(res) ? res : (res?.data || []);
      setStudents(studentList);
    } catch (err) {
      console.error('Failed to load students for class:', err);
      toast.error('Could not load students for the selected class.');
    } finally {
      setLoadingStudents(false);
    }
  };

  /**
   * Fetch payment history records
   */
  const fetchPayments = async () => {
    setLoading(true);
    try {
      const data = await bursarService.getPayments();
      const paymentList = Array.isArray(data) ? data : (data?.data || []);
      setPayments(paymentList);
    } catch (err) {
      console.error('Failed to fetch payments history:', err);
      toast.error('Failed to load payment history.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle form input changes
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /**
   * Handle Payment Form Submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formClassId) {
      toast.warning('Please select a class first.');
      return;
    }
    if (!formData.student_id) {
      toast.warning('Please select a student.');
      return;
    }
    if (!formData.amount_paid || parseFloat(formData.amount_paid) <= 0) {
      toast.warning('Please enter a valid payment amount.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await bursarService.createPayment({
        student_id: parseInt(formData.student_id, 10),
        amount_paid: parseFloat(formData.amount_paid),
        term: formData.term,
        academic_session: formData.academic_session,
        payment_method: formData.payment_method,
        reference_number: formData.reference_number || undefined
      });

      const paymentRecord = res.data || res;
      toast.success(`Payment of ₦${parseFloat(formData.amount_paid).toLocaleString()} recorded successfully!`);

      // Refresh payment list & clear form amount
      fetchPayments();
      setFormData(prev => ({
        ...prev,
        amount_paid: '',
        reference_number: ''
      }));

      // Automatically open receipt view for the recorded payment
      if (paymentRecord) {
        setActiveReceipt(paymentRecord);
        setShowReceiptModal(true);
      }
    } catch (err) {
      console.error('Payment submission failed:', err);
      toast.error(err?.response?.data?.message || 'Failed to record payment.');
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Trigger Receipt Modal View
   */
  const handleViewReceipt = (payment) => {
    setActiveReceipt(payment);
    setShowReceiptModal(true);
  };

  /**
   * Trigger Browser Print for Receipt
   */
  const handlePrint = () => {
    window.print();
  };

  /**
   * Dynamically build dropdown class options (combining complete backend classes & any extra in payments)
   */
  const displayClasses = React.useMemo(() => {
    const map = new Map();

    // 1. Add complete backend classes
    allClasses.forEach(c => {
      const label = c.arm ? `${c.name} (${c.arm})` : c.name;
      map.set(label, label);
    });

    // 2. Backup check for classes present in payments payload
    payments.forEach(p => {
      const cls = p.student?.class;
      if (cls) {
        const label = cls.arm ? `${cls.name} (${cls.arm})` : cls.name;
        if (!map.has(label)) {
          map.set(label, label);
        }
      }
    });

    return Array.from(map.values()).sort();
  }, [allClasses, payments]);

  /**
   * Combined Filter Logic: Search Input + Class + Term + Session + Status
   */
  const filteredPayments = payments.filter(p => {
    // 1. Search Filter (Student Name, Admission No, Reference No)
    if (searchTerm.trim()) {
      const termLower = searchTerm.toLowerCase();
      const studentName = p.student ? `${p.student.first_name || ''} ${p.student.last_name || ''} ${p.student.name || ''}`.toLowerCase() : '';
      const admNo = p.student?.admission_number ? p.student.admission_number.toLowerCase() : '';
      const refNo = p.reference_number ? p.reference_number.toLowerCase() : '';
      const matchesSearch = studentName.includes(termLower) || admNo.includes(termLower) || refNo.includes(termLower);
      if (!matchesSearch) return false;
    }

    // 2. Class Filter
    if (filterClass !== 'ALL') {
      const cls = p.student?.class;
      const clsName = cls ? (cls.arm ? `${cls.name} (${cls.arm})` : cls.name) : '';
      if (clsName.toLowerCase() !== filterClass.toLowerCase()) return false;
    }

    // 3. Term Filter
    if (filterTerm !== 'ALL' && p.term !== filterTerm) {
      return false;
    }

    // 4. Session Filter
    if (filterSession !== 'ALL' && p.academic_session !== filterSession) {
      return false;
    }

    // 5. Status Filter
    if (filterStatus !== 'ALL') {
      const statusVal = (p.status || 'completed').toLowerCase();
      if (statusVal !== filterStatus.toLowerCase()) return false;
    }

    return true;
  });

  const schoolInfo = school || {
    name: 'EduTrack Academy',
    address: '12 Educational Blvd, Victoria Island, Lagos',
    phone: '+234 801 234 5678',
    logo_url: ''
  };

  return (
    <div className="min-h-screen text-slate-900 dark:text-slate-100">
      
      {/* ========================================================================= */}
      {/* MAIN BURSAR DASHBOARD VIEW (Hidden when printing receipt) */}
      {/* ========================================================================= */}
      <div className="print:hidden p-6 md:p-10 max-w-7xl mx-auto space-y-10 animate-fade-in">
        
        {/* Navigation & Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-300 dark:border-slate-700/80">
          <div>
            <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 transition-colors mb-3">
              <ArrowLeft size={18} /> Back to Dashboard
            </Link>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shadow-inner">
                <DollarSign size={32} />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">Fee Management & Payments</h1>
                <p className="text-base text-slate-600 dark:text-slate-300 mt-1">
                  Record student tuition transactions, update fee clearance, and generate official receipts.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 1. Payment Recording Form Card */}
        <div className="glass-panel p-8 md:p-10 rounded-3xl border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-900/80 shadow-2xl backdrop-blur-md space-y-6">
          <div className="flex items-center gap-3 pb-5 border-b border-slate-200 dark:border-slate-700/80">
            <Receipt className="text-cyan-600 dark:text-cyan-400" size={26} />
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">Record Student Fee Payment</h2>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Cascading: Select Class First */}
            <div className="md:col-span-6">
              <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2.5 flex items-center gap-2">
                <School size={16} className="text-cyan-600 dark:text-cyan-400" /> Select Class <span className="text-rose-500 dark:text-rose-400">*</span>
              </label>
              <select
                value={formClassId}
                onChange={(e) => setFormClassId(e.target.value)}
                required
                className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 text-base font-medium focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500 dark:focus:ring-cyan-400 transition-all cursor-pointer"
              >
                <option value="">-- Choose Class --</option>
                {allClasses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.arm ? `${c.name} (${c.arm})` : c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Cascading: Select Student (Enabled ONLY after class is chosen) */}
            <div className="md:col-span-6">
              <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2.5 flex items-center gap-2">
                <User size={16} className="text-cyan-600 dark:text-cyan-400" /> Select Student <span className="text-rose-500 dark:text-rose-400">*</span>
                {!formClassId && (
                  <span className="text-xs font-normal text-slate-400 dark:text-slate-500 ml-1">(Select a class first)</span>
                )}
              </label>
              <select
                name="student_id"
                value={formData.student_id}
                onChange={handleChange}
                required
                disabled={!formClassId || loadingStudents}
                className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 text-base font-medium focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500 dark:focus:ring-cyan-400 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {loadingStudents 
                    ? '⏳ Loading students...' 
                    : !formClassId 
                      ? '-- Select a class first --' 
                      : students.length === 0 
                        ? '-- No students in this class --' 
                        : '-- Choose Student --'
                  }
                </option>
                {students.map(s => {
                  const sName = s.first_name ? `${s.first_name} ${s.last_name}` : s.name;
                  return (
                    <option key={s.id} value={s.id}>
                      {sName} ({s.admission_number})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Amount Paid */}
            <div className="md:col-span-6">
              <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2.5 flex items-center gap-2">
                <DollarSign size={16} className="text-cyan-600 dark:text-cyan-400" /> Amount Paid (₦) <span className="text-rose-500 dark:text-rose-400">*</span>
              </label>
              <input
                type="number"
                name="amount_paid"
                value={formData.amount_paid}
                onChange={handleChange}
                placeholder="e.g. 150000"
                min="1"
                step="0.01"
                required
                className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 text-base font-semibold focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500 dark:focus:ring-cyan-400 transition-all"
              />
            </div>

            {/* Academic Term */}
            <div className="md:col-span-6">
              <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2.5 flex items-center gap-2">
                <Calendar size={16} className="text-cyan-600 dark:text-cyan-400" /> Academic Term <span className="text-rose-500 dark:text-rose-400">*</span>
              </label>
              <select
                name="term"
                value={formData.term}
                onChange={handleChange}
                required
                className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 text-base font-medium focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500 dark:focus:ring-cyan-400 transition-all cursor-pointer"
              >
                <option value="1st Term">1st Term</option>
                <option value="2nd Term">2nd Term</option>
                <option value="3rd Term">3rd Term</option>
              </select>
            </div>

            {/* Academic Session */}
            <div className="md:col-span-4">
              <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2.5 flex items-center gap-2">
                <GraduationCap size={16} className="text-cyan-600 dark:text-cyan-400" /> Academic Session <span className="text-rose-500 dark:text-rose-400">*</span>
              </label>
              <select
                name="academic_session"
                value={formData.academic_session}
                onChange={handleChange}
                required
                className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 text-base font-medium focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500 dark:focus:ring-cyan-400 transition-all cursor-pointer"
              >
                <option value="2024/2025">2024/2025</option>
                <option value="2025/2026">2025/2026</option>
                <option value="2026/2027">2026/2027</option>
              </select>
            </div>

            {/* Payment Method */}
            <div className="md:col-span-4">
              <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2.5 flex items-center gap-2">
                <CreditCard size={16} className="text-cyan-600 dark:text-cyan-400" /> Payment Method <span className="text-rose-500 dark:text-rose-400">*</span>
              </label>
              <select
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
                required
                className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 text-base font-medium focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500 dark:focus:ring-cyan-400 transition-all cursor-pointer"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="POS">POS</option>
              </select>
            </div>

            {/* Reference Number (Optional) */}
            <div className="md:col-span-4">
              <label className="block text-sm font-bold text-slate-800 dark:text-slate-200 mb-2.5 flex items-center gap-2">
                <Hash size={16} className="text-cyan-600 dark:text-cyan-400" /> Reference / Teller No. <span className="text-slate-500 dark:text-slate-400 font-normal text-xs">(Optional)</span>
              </label>
              <input
                type="text"
                name="reference_number"
                value={formData.reference_number}
                onChange={handleChange}
                placeholder="e.g. TR-982347102"
                className="w-full px-4 py-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/90 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 text-base font-mono focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500 dark:focus:ring-cyan-400 transition-all"
              />
            </div>

            {/* Submit Button */}
            <div className="md:col-span-12 flex items-end justify-end">
              <button
                type="submit"
                disabled={submitting || !formClassId || !formData.student_id}
                className="py-3.5 px-8 rounded-xl bg-cyan-600 hover:bg-cyan-500 dark:bg-cyan-500 dark:hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-white dark:text-slate-950 font-extrabold text-base flex items-center justify-center gap-2 transition-all shadow-lg hover:shadow-cyan-500/20 active:scale-95 cursor-pointer"
              >
                {submitting ? (
                  <><span className="spinner spinner-sm"></span> Processing...</>
                ) : (
                  <><DollarSign size={20} /> Record Payment & Print Receipt</>
                )}
              </button>
            </div>

          </form>
        </div>

        {/* 2. Payment History Table Section */}
        <div className="glass-panel p-8 md:p-10 rounded-3xl border border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-900/80 shadow-2xl backdrop-blur-md space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-200 dark:border-slate-700/80">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="text-cyan-600 dark:text-cyan-400" size={24} /> Payment History & Audit Directory
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                Showing all recorded student tuition and fee transactions.
              </p>
            </div>

            <div className="text-right">
              <span className="inline-block px-4 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-cyan-700 dark:text-cyan-400 text-sm font-extrabold">
                Total Shown: {filteredPayments.length} Record(s)
              </span>
            </div>
          </div>

          {/* Filter Toolbar (Search + Class + Term + Session + Status) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-4 bg-slate-50 dark:bg-slate-950/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80">
            
            {/* Search Input */}
            <div className="md:col-span-4">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Search size={14} className="text-cyan-600 dark:text-cyan-400" /> Search Student / Ref
              </label>
              <div className="relative">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Name, Adm #, or Ref #..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-400 transition-all font-medium"
                />
              </div>
            </div>

            {/* Class Filter Dropdown (Complete Backend List) */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Layers size={14} className="text-cyan-600 dark:text-cyan-400" /> Class
              </label>
              <select
                value={filterClass}
                onChange={(e) => setFilterClass(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-400 transition-all cursor-pointer font-medium"
              >
                <option value="ALL">All Classes</option>
                {displayClasses.map(clsName => (
                  <option key={clsName} value={clsName}>{clsName}</option>
                ))}
              </select>
            </div>

            {/* Term Filter Dropdown */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar size={14} className="text-cyan-600 dark:text-cyan-400" /> Term
              </label>
              <select
                value={filterTerm}
                onChange={(e) => setFilterTerm(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-400 transition-all cursor-pointer font-medium"
              >
                <option value="ALL">All Terms</option>
                <option value="1st Term">1st Term</option>
                <option value="2nd Term">2nd Term</option>
                <option value="3rd Term">3rd Term</option>
              </select>
            </div>

            {/* Session Filter Dropdown */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <GraduationCap size={14} className="text-cyan-600 dark:text-cyan-400" /> Session
              </label>
              <select
                value={filterSession}
                onChange={(e) => setFilterSession(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-400 transition-all cursor-pointer font-medium"
              >
                <option value="ALL">All Sessions</option>
                <option value="2024/2025">2024/2025</option>
                <option value="2025/2026">2025/2026</option>
                <option value="2026/2027">2026/2027</option>
              </select>
            </div>

            {/* Status Filter Dropdown */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Filter size={14} className="text-cyan-600 dark:text-cyan-400" /> Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-400 transition-all cursor-pointer font-medium"
              >
                <option value="ALL">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>
            </div>

          </div>

          {/* Table Area */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
              <span className="spinner w-10 h-10 border-4 border-cyan-500 dark:border-cyan-400 border-t-transparent rounded-full animate-spin mb-4"></span>
              <p className="text-sm font-semibold">Fetching payment history records...</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="p-16 text-center text-slate-600 dark:text-slate-300 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-950/40">
              <Receipt size={48} className="mx-auto text-slate-400 dark:text-slate-500 mb-3" />
              <p className="text-base font-bold text-slate-800 dark:text-slate-200">No payment records match filter criteria</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Try adjusting the search query or class/term dropdown filters above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-lg">
              <table className="w-full text-left border-collapse text-sm md:text-base">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-slate-700 font-extrabold uppercase tracking-wider text-xs">
                    <th className="py-4 px-5">Date</th>
                    <th className="py-4 px-5">Ref Number</th>
                    <th className="py-4 px-5">Student Name</th>
                    <th className="py-4 px-5">Class</th>
                    <th className="py-4 px-5">Term & Session</th>
                    <th className="py-4 px-5 text-right">Amount Paid</th>
                    <th className="py-4 px-5 text-center">Method</th>
                    <th className="py-4 px-5 text-center">Status</th>
                    <th className="py-4 px-5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700/60 text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900/40">
                  {filteredPayments.map(payment => {
                    const student = payment.student || {};
                    const sName = student.first_name ? `${student.first_name} ${student.last_name}` : (student.name || 'N/A');
                    const cls = student.class;
                    const cName = cls ? (cls.arm ? `${cls.name} (${cls.arm})` : cls.name) : 'N/A';
                    const dateStr = payment.created_at ? new Date(payment.created_at).toLocaleDateString() : 'N/A';

                    return (
                      <tr key={payment.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors">
                        <td className="py-4 px-5 text-slate-600 dark:text-slate-300 whitespace-nowrap font-medium">{dateStr}</td>
                        <td className="py-4 px-5 font-mono font-bold text-cyan-700 dark:text-cyan-300">{payment.reference_number}</td>
                        <td className="py-4 px-5">
                          <strong className="block text-slate-900 dark:text-white font-bold text-base">{sName}</strong>
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono font-semibold">{student.admission_number || 'No Adm No'}</span>
                        </td>
                        <td className="py-4 px-5 font-bold text-slate-800 dark:text-slate-200">
                          <span className="inline-block px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs">
                            {cName}
                          </span>
                        </td>
                        <td className="py-4 px-5 font-semibold text-slate-800 dark:text-slate-200">
                          {payment.term} <span className="text-slate-500 dark:text-slate-400 text-xs font-normal">({payment.academic_session})</span>
                        </td>
                        <td className="py-4 px-5 text-right font-extrabold text-emerald-600 dark:text-emerald-400 text-base">
                          ₦{parseFloat(payment.amount_paid || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-5 text-center">
                          <span className="inline-block px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs">
                            {payment.payment_method}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-center">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-300 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-extrabold text-xs uppercase">
                            <CheckCircle2 size={14} /> {payment.status || 'Completed'}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-center">
                          <button
                            type="button"
                            onClick={() => handleViewReceipt(payment)}
                            className="px-3.5 py-2 rounded-xl bg-cyan-100 dark:bg-cyan-500/15 hover:bg-cyan-200 dark:hover:bg-cyan-500/30 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/40 font-bold text-xs inline-flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                          >
                            <Printer size={15} /> Receipt
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. ENTERPRISE RECEIPT MODAL & PRINTABLE VIEW */}
      {/* Uses Tailwind print:block so window.print() only prints the receipt */}
      {/* ========================================================================= */}
      {showReceiptModal && activeReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
          
          <div className="bg-white text-slate-900 w-full max-w-xl rounded-3xl p-8 md:p-10 shadow-2xl border border-slate-300 print:shadow-none print:border-none print:p-6 print:w-full print:max-w-none print:rounded-none">
            
            {/* Modal Header Controls (Hidden on Print) */}
            <div className="flex items-center justify-between pb-5 mb-6 border-b border-slate-200 print:hidden">
              <span className="text-sm font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                <ShieldCheck size={18} className="text-emerald-600" /> Printable Payment Receipt
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  <Printer size={16} /> Print Receipt
                </button>
                <button
                  type="button"
                  onClick={() => setShowReceiptModal(false)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Printable Receipt Body */}
            <div className="receipt-content space-y-6">
              
              {/* Receipt Header: School Logo & Info */}
              <div className="flex items-center justify-between border-b-2 border-slate-900 pb-5 gap-4">
                <div className="flex items-center gap-3.5">
                  {schoolInfo.logo_url && (
                    <img src={schoolInfo.logo_url} alt={schoolInfo.name} className="h-16 object-contain" />
                  )}
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                      {schoolInfo.name || 'EduTrack Academy'}
                    </h2>
                    <p className="text-xs text-slate-700 font-medium">
                      {schoolInfo.address}
                    </p>
                    <p className="text-xs text-slate-600">
                      {schoolInfo.phone ? `Tel: ${schoolInfo.phone}` : ''}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-block px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-extrabold uppercase tracking-wider mb-1">
                    Official Fee Receipt
                  </span>
                  <p className="text-xs font-mono font-bold text-slate-800">
                    Ref: {activeReceipt.reference_number}
                  </p>
                  <p className="text-xs text-slate-600">
                    Date: {activeReceipt.created_at ? new Date(activeReceipt.created_at).toLocaleDateString() : new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Student & Payment Summary Grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200 text-sm">
                <div>
                  <span className="block text-xs uppercase text-slate-500 font-bold mb-0.5">Student Name</span>
                  <strong className="text-slate-900 font-bold text-base">
                    {activeReceipt.student?.first_name ? `${activeReceipt.student.first_name} ${activeReceipt.student.last_name}` : (activeReceipt.student?.name || 'N/A')}
                  </strong>
                </div>
                <div>
                  <span className="block text-xs uppercase text-slate-500 font-bold mb-0.5">Admission Number</span>
                  <strong className="text-slate-800 font-mono text-base">
                    {activeReceipt.student?.admission_number || 'N/A'}
                  </strong>
                </div>
                <div>
                  <span className="block text-xs uppercase text-slate-500 font-bold mb-0.5">Class Arm</span>
                  <strong className="text-slate-800 font-semibold">
                    {activeReceipt.student?.class ? `${activeReceipt.student.class.name} ${activeReceipt.student.class.arm || ''}` : 'N/A'}
                  </strong>
                </div>
                <div>
                  <span className="block text-xs uppercase text-slate-500 font-bold mb-0.5">Payment Method</span>
                  <strong className="text-slate-800 uppercase font-semibold">
                    {activeReceipt.payment_method}
                  </strong>
                </div>
                <div>
                  <span className="block text-xs uppercase text-slate-500 font-bold mb-0.5">Academic Term</span>
                  <strong className="text-slate-800 font-semibold">{activeReceipt.term}</strong>
                </div>
                <div>
                  <span className="block text-xs uppercase text-slate-500 font-bold mb-0.5">Academic Session</span>
                  <strong className="text-slate-800 font-semibold">{activeReceipt.academic_session}</strong>
                </div>
              </div>

              {/* Amount Paid Box */}
              <div className="bg-emerald-50 border-2 border-emerald-500/40 rounded-2xl p-6 flex items-center justify-between text-slate-900 shadow-sm">
                <div>
                  <span className="block text-xs uppercase font-extrabold text-emerald-900 tracking-wider mb-1">
                    Total Amount Paid
                  </span>
                  <span className="text-3xl font-black text-emerald-950">
                    ₦{parseFloat(activeReceipt.amount_paid || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-600 text-white font-extrabold text-xs uppercase tracking-wider">
                    <CheckCircle2 size={15} /> {activeReceipt.status || 'CLEARED'}
                  </span>
                </div>
              </div>

              {/* Signatures & Security Verification Seal */}
              <div className="pt-4 grid grid-cols-12 gap-4 items-end text-xs">
                
                {/* QR Code Verification */}
                <div className="col-span-4 flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=Verify-Payment-${activeReceipt.reference_number}-${activeReceipt.student?.admission_number}`}
                    alt="Receipt Verification QR"
                    className="w-18 h-18 object-contain"
                  />
                  <span className="text-[9px] font-mono font-bold text-slate-600 uppercase mt-1.5">
                    Scan to Verify Receipt
                  </span>
                </div>

                {/* Authorized Signatures */}
                <div className="col-span-8 grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="border-b border-slate-900 h-12 mb-1 flex items-end justify-center pb-1">
                      <span className="font-serif italic text-slate-500 text-xs">Bursar Sign</span>
                    </div>
                    <span className="font-bold text-slate-800 text-xs">Bursar / Cashier Signature</span>
                  </div>
                  <div>
                    <div className="border-b border-slate-900 h-12 mb-1 flex items-end justify-center pb-1">
                      <span className="font-serif italic text-slate-500 text-xs">Official Stamp</span>
                    </div>
                    <span className="font-bold text-slate-800 text-xs">School Stamp</span>
                  </div>
                </div>

              </div>

              {/* Footer Note */}
              <div className="pt-3 text-center text-xs text-slate-500 border-t border-slate-200 italic">
                This is an official computer-generated fee receipt issued by {schoolInfo.name || 'EduTrack Academy'}. Valid without erasure.
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};

export default FeePayments;
