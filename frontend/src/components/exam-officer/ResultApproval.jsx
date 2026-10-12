import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
  CheckCircle2, 
  CheckSquare, 
  Square, 
  Lock, 
  AlertTriangle, 
  RefreshCw, 
  Search, 
  Filter, 
  BookOpen, 
  User, 
  Award,
  ShieldAlert
} from 'lucide-react';
import examOfficerService from '../../services/examOfficerService';

/**
 * ResultApproval Component
 * Exam Officer interface for reviewing and approving pending student results.
 * Includes time-bound window enforcement (403 Window Closed handling) and bulk operations.
 */
const ResultApproval = () => {
  const [pendingResults, setPendingResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);
  const [isBulkActioning, setIsBulkActioning] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isWindowClosed, setIsWindowClosed] = useState(false);
  const [windowErrorMessage, setWindowErrorMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');

  // Fetch pending results on component mount
  useEffect(() => {
    fetchPendingResults();
  }, []);

  const fetchPendingResults = async () => {
    setLoading(true);
    try {
      const data = await examOfficerService.getPendingResults();
      const list = Array.isArray(data) ? data : (data?.data || []);
      setPendingResults(list);
    } catch (err) {
      console.error('Failed to fetch pending results:', err);
      toast.error('Failed to load pending results.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Single Result Approval Handler
   * Catches 403 Forbidden errors when ResultWindow is closed.
   */
  const handleApprove = async (id) => {
    if (isWindowClosed) {
      toast.error('Result window is closed. Action forbidden.');
      return;
    }

    setActioningId(id);
    try {
      await examOfficerService.approveResult(id);
      toast.success('Result approved successfully!');
      setPendingResults(prev => prev.filter(item => item.id !== id));
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    } catch (err) {
      console.error('Approval Error:', err);
      if (err.response?.status === 403 || err.response?.data?.message?.toLowerCase().includes('closed')) {
        const errorMsg = err.response?.data?.message || 'Result window is closed. Action forbidden.';
        toast.error('Result window is closed. Action forbidden.');
        setIsWindowClosed(true);
        setWindowErrorMessage(errorMsg);
      } else {
        toast.error(err.response?.data?.message || 'Failed to approve result.');
      }
    } finally {
      setActioningId(null);
    }
  };

  /**
   * Bulk Result Approval Handler
   * Catches 403 Forbidden errors when ResultWindow is closed.
   */
  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    if (isWindowClosed) {
      toast.error('Result window is closed. Action forbidden.');
      return;
    }

    setIsBulkActioning(true);
    try {
      await examOfficerService.bulkApprove(selectedIds);
      toast.success(`${selectedIds.length} results approved successfully!`);
      setPendingResults(prev => prev.filter(item => !selectedIds.includes(item.id)));
      setSelectedIds([]);
    } catch (err) {
      console.error('Bulk Approval Error:', err);
      if (err.response?.status === 403 || err.response?.data?.message?.toLowerCase().includes('closed')) {
        const errorMsg = err.response?.data?.message || 'Result window is closed. Action forbidden.';
        toast.error('Result window is closed. Action forbidden.');
        setIsWindowClosed(true);
        setWindowErrorMessage(errorMsg);
      } else {
        toast.error(err.response?.data?.message || 'Failed to bulk approve results.');
      }
    } finally {
      setIsBulkActioning(false);
    }
  };

  // Toggle selection for individual row
  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Toggle all visible filtered rows
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredResults.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredResults.map(r => r.id));
    }
  };

  // Filtered results list based on search and class dropdown
  const filteredResults = pendingResults.filter(res => {
    const studentName = (res.student?.first_name ? `${res.student.first_name} ${res.student.last_name}` : res.student?.name || '').toLowerCase();
    const admNo = (res.student?.admission_number || '').toLowerCase();
    const subjectName = (res.subject?.name || '').toLowerCase();
    const matchesSearch = studentName.includes(searchTerm.toLowerCase()) || 
                          admNo.includes(searchTerm.toLowerCase()) || 
                          subjectName.includes(searchTerm.toLowerCase());

    const className = res.student?.class?.name || res.school_class?.name || '';
    const matchesClass = selectedClass === 'ALL' || className === selectedClass;

    return matchesSearch && matchesClass;
  });

  // Extract unique class names for filter dropdown
  const availableClasses = Array.from(
    new Set(pendingResults.map(r => r.student?.class?.name || r.school_class?.name).filter(Boolean))
  );

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Result Approvals & Verification
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Review teacher grade submissions, verify scores, and issue final approvals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchPendingResults}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleBulkApprove}
            disabled={selectedIds.length === 0 || isBulkActioning || isWindowClosed}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg shadow-sm transition-all ${
              isWindowClosed || selectedIds.length === 0
                ? 'bg-slate-300 text-slate-500 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 dark:shadow-none'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {isBulkActioning ? 'Approving...' : `Approve Selected (${selectedIds.length})`}
          </button>
        </div>
      </div>

      {/* Time-Bound Window Closed Warning Alert */}
      {isWindowClosed && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-l-4 border-amber-500 p-4 rounded-xl shadow-sm flex items-start gap-3 text-amber-900 dark:text-amber-200">
          <ShieldAlert className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Lock className="w-4 h-4 inline" /> Result Window Closed
            </h3>
            <p className="text-sm mt-0.5 text-amber-800 dark:text-amber-300">
              {windowErrorMessage || 'Result submission and approval window is currently closed. Approval actions have been disabled.'}
            </p>
          </div>
        </div>
      )}

      {/* Filters & Search Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search student name, ID, or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>

        {/* Class Filter */}
        <div className="relative">
          <Filter className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none"
          >
            <option value="ALL">All Classes</option>
            {availableClasses.map((cls, idx) => (
              <option key={idx} value={cls}>{cls}</option>
            ))}
          </select>
        </div>

        {/* Selected Count Indicator */}
        <div className="flex items-center justify-end text-sm text-slate-600 dark:text-slate-400 font-medium px-2">
          Showing {filteredResults.length} pending result{filteredResults.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500 dark:text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-3" />
            <p className="text-base font-medium">Fetching pending results...</p>
          </div>
        ) : filteredResults.length === 0 ? (
          <div className="py-16 text-center text-slate-500 dark:text-slate-400">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-3 opacity-80" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">All Clear!</h3>
            <p className="text-sm mt-1">There are no pending results awaiting approval matching your filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-4 px-4 text-center w-12">
                    <button onClick={toggleSelectAll} className="text-slate-500 hover:text-indigo-600">
                      {selectedIds.length === filteredResults.length && filteredResults.length > 0 ? (
                        <CheckSquare className="w-5 h-5 text-indigo-600" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </th>
                  <th className="py-4 px-4">Student Details</th>
                  <th className="py-4 px-4">Subject & Class</th>
                  <th className="py-4 px-4 text-center">CA / Exam</th>
                  <th className="py-4 px-4 text-center">Total</th>
                  <th className="py-4 px-4 text-center">Grade</th>
                  <th className="py-4 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700 text-sm text-slate-800 dark:text-slate-200">
                {filteredResults.map((result) => {
                  const studentName = result.student?.name || `${result.student?.first_name || ''} ${result.student?.last_name || ''}`.trim() || 'Unknown Student';
                  const admissionNo = result.student?.admission_number || 'N/A';
                  const subjectName = result.subject?.name || 'Subject';
                  const className = result.student?.class?.name || result.school_class?.name || 'N/A';
                  const isSelected = selectedIds.includes(result.id);
                  const isProcessing = actioningId === result.id;

                  return (
                    <tr 
                      key={result.id} 
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors ${isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="py-4 px-4 text-center">
                        <button onClick={() => toggleSelect(result.id)} className="text-slate-500 hover:text-indigo-600">
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-indigo-600" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>
                      </td>

                      {/* Student Info */}
                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          {studentName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                          {admissionNo}
                        </div>
                      </td>

                      {/* Subject & Class */}
                      <td className="py-4 px-4">
                        <div className="font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                          <BookOpen className="w-4 h-4 text-indigo-500" />
                          {subjectName}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          Class: {className}
                        </div>
                      </td>

                      {/* CA / Exam Breakdown */}
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-mono font-medium px-2.5 py-1 bg-slate-100 dark:bg-slate-700 rounded-md">
                          <span className="text-indigo-600 dark:text-indigo-400">{result.ca_score ?? 0}</span>
                          <span className="text-slate-400">/</span>
                          <span className="text-emerald-600 dark:text-emerald-400">{result.exam_score ?? 0}</span>
                        </span>
                      </td>

                      {/* Total Score */}
                      <td className="py-4 px-4 text-center font-bold text-base text-slate-900 dark:text-white">
                        {result.total_score ?? ((result.ca_score || 0) + (result.exam_score || 0))}
                      </td>

                      {/* Grade Badge */}
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full ${
                          (result.total_score >= 70 || result.grade === 'A')
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : (result.total_score >= 60 || result.grade === 'B')
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : (result.total_score >= 50 || result.grade === 'C')
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                        }`}>
                          {result.grade || 'N/A'}
                        </span>
                      </td>

                      {/* Action Button */}
                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleApprove(result.id)}
                          disabled={isProcessing || isWindowClosed}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg shadow-sm transition-all ${
                            isWindowClosed
                              ? 'bg-slate-200 text-slate-400 dark:bg-slate-700 dark:text-slate-500 cursor-not-allowed'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-100 dark:shadow-none'
                          }`}
                        >
                          {isProcessing ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : isWindowClosed ? (
                            <Lock className="w-3.5 h-3.5" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          {isProcessing ? 'Saving...' : 'Approve'}
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
  );
};

export default ResultApproval;
