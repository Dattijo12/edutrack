import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  ArrowLeft, 
  FileCheck2, 
  CheckCircle2, 
  CheckCheck, 
  Filter, 
  RotateCcw, 
  CheckSquare, 
  Layers,
  BookOpen
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import examOfficerService from '../../services/examOfficerService';
import classService from '../../services/classService';
import subjectService from '../../services/subjectService';

const Approvals = () => {
  const [pendingResults, setPendingResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);

  // Filter state
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [classesList, setClassesList] = useState([]);
  const [subjectsList, setSubjectsList] = useState([]);

  // Bulk selection state
  const [selectedResultIds, setSelectedResultIds] = useState([]);
  const [bulkApproving, setBulkApproving] = useState(false);

  // Rejection modal state variables
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectingResultId, setRejectingResultId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetchDropdownOptions();
    fetchPending();
  }, []);

  /**
   * Load options for Class and Subject filter dropdowns
   */
  const fetchDropdownOptions = async () => {
    try {
      const [classesRes, subjectsRes] = await Promise.all([
        examOfficerService.getClasses().catch(() => classService.getAll().catch(() => [])),
        examOfficerService.getSubjects().catch(() => subjectService.getAll().catch(() => []))
      ]);
      const classesData = Array.isArray(classesRes) ? classesRes : (classesRes?.data || []);
      const subjectsData = Array.isArray(subjectsRes) ? subjectsRes : (subjectsRes?.data || []);
      setClassesList(classesData);
      setSubjectsList(subjectsData);
    } catch (error) {
      console.error('Failed to load filter options:', error);
    }
  };

  /**
   * Fetch pending results with optional class_id and subject_id filtering parameters.
   */
  const fetchPending = async (classId = selectedClass, subjectId = selectedSubject) => {
    setLoading(true);
    try {
      const params = {};
      if (classId) params.class_id = classId;
      if (subjectId) params.subject_id = subjectId;

      const data = await examOfficerService.getPendingResults(params);
      setPendingResults(data || []);
      // Reset selected checkboxes on new fetch
      setSelectedResultIds([]);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load pending results.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle filter form submission
   */
  const handleFilter = (e) => {
    if (e) e.preventDefault();
    fetchPending(selectedClass, selectedSubject);
  };

  /**
   * Reset filter parameters
   */
  const handleResetFilter = () => {
    setSelectedClass('');
    setSelectedSubject('');
    fetchPending('', '');
  };

  /**
   * Select All / Deselect All Checkboxes
   */
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = pendingResults.map(r => r.id);
      setSelectedResultIds(allIds);
    } else {
      setSelectedResultIds([]);
    }
  };

  /**
   * Toggle Individual Result Checkbox Selection
   */
  const handleSelectOne = (id) => {
    setSelectedResultIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  /**
   * Bulk Approve Selected Results
   */
  const handleBulkApprove = async () => {
    if (selectedResultIds.length === 0) return;

    setBulkApproving(true);
    try {
      const response = await examOfficerService.bulkApprove(selectedResultIds);
      const count = response.approved_count || selectedResultIds.length;
      toast.success(`Successfully approved ${count} result(s)!`);
      
      // Clear selection and refresh list
      setSelectedResultIds([]);
      fetchPending(selectedClass, selectedSubject);
    } catch (error) {
      console.error('Bulk approval failed:', error);
      toast.error('Failed to perform bulk approval.');
    } finally {
      setBulkApproving(false);
    }
  };

  /**
   * Approve a single pending result entry.
   */
  const handleApprove = async (id) => {
    setActioningId(id);
    try {
      await examOfficerService.approveResult(id);
      toast.success(`Result #${id} approved successfully!`);
      setPendingResults(prev => prev.filter(r => r.id !== id));
      setSelectedResultIds(prev => prev.filter(item => item !== id));
    } catch (error) {
      console.error(error);
      toast.error(`Failed to approve result.`);
    } finally {
      setActioningId(null);
    }
  };

  /**
   * Submit result rejection feedback.
   */
  const handleConfirmRejection = async (id, reason) => {
    if (!reason || !reason.trim()) {
      toast.warning('Please enter a valid rejection reason.');
      return;
    }

    setActioningId(id);
    try {
      await examOfficerService.rejectResult(id, reason.trim());
      toast.info(`Result #${id} rejected and returned for teacher correction.`);
      setPendingResults(prev => prev.filter(r => r.id !== id));
      setSelectedResultIds(prev => prev.filter(item => item !== id));
      
      // Close dialog and clear state
      setIsRejectModalOpen(false);
      setRejectingResultId(null);
      setRejectionReason("");
    } catch (error) {
      console.error(error);
      toast.error('Failed to reject result.');
    } finally {
      setActioningId(null);
    }
  };

  const isAllSelected = pendingResults.length > 0 && selectedResultIds.length === pendingResults.length;

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }} className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '40px' }}>
        
        {/* Header Section */}
        <div style={{ marginBottom: '30px', borderBottom: '1px solid var(--border-dark)', paddingBottom: '20px' }}>
          <Link to="/dashboard" className="back-link">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(0, 242, 254, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0, 242, 254, 0.25)' }}>
                <FileCheck2 size={24} color="#00f2fe" />
              </div>
              <div>
                <h2 style={{ fontSize: '28px', fontWeight: '700' }}>Pending Grade Approvals</h2>
                <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '14px', marginTop: '2px' }}>
                  Review, filter, and verify teacher-submitted student grades.
                </p>
              </div>
            </div>

            {/* Bulk Actions Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {selectedResultIds.length > 0 && (
                <span className="text-xs px-3 py-1.5 rounded-full bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30">
                  {selectedResultIds.length} Selected
                </span>
              )}
              <Button
                onClick={handleBulkApprove}
                disabled={selectedResultIds.length === 0 || bulkApproving}
                className="btn-success flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg hover:shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bulkApproving ? (
                  <><span className="spinner spinner-sm"></span> Approving...</>
                ) : (
                  <><CheckSquare size={18} /> Bulk Approve ({selectedResultIds.length})</>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Filter Section Controls */}
        <form 
          onSubmit={handleFilter}
          className="mb-8 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md grid grid-cols-1 md:grid-cols-12 gap-4 items-end"
        >
          {/* Class Selector Dropdown */}
          <div className="md:col-span-4">
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
              <Layers size={14} className="text-cyan-400" /> Filter by Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-100 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
            >
              <option value="">All Classes</option>
              {classesList.map(cls => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} {cls.arm ? `(${cls.arm})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Subject Selector Dropdown */}
          <div className="md:col-span-4">
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
              <BookOpen size={14} className="text-cyan-400" /> Filter by Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-100 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all"
            >
              <option value="">All Subjects</option>
              {subjectsList.map(sub => (
                <option key={sub.id} value={sub.id}>
                  {sub.name} ({sub.code || sub.subject_code || 'SUB'})
                </option>
              ))}
            </select>
          </div>

          {/* Filter Action Buttons */}
          <div className="md:col-span-4 flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-cyan-500/20 active:scale-[0.98]"
            >
              <Filter size={16} /> Filter Results
            </button>

            {(selectedClass || selectedSubject) && (
              <button
                type="button"
                onClick={handleResetFilter}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm flex items-center justify-center gap-1.5 border border-slate-700 transition-all"
                title="Reset Filters"
              >
                <RotateCcw size={16} /> Reset
              </button>
            )}
          </div>
        </form>

        {/* Content Body */}
        {loading ? (
          <div className="page-loading">
            <span className="spinner"></span>
            <p>Loading pending grade submissions...</p>
          </div>
        ) : pendingResults.length === 0 ? (
          <div className="empty-state">
            <CheckCheck size={48} color="#00e676" style={{ opacity: 0.8, marginBottom: '12px' }} />
            <p style={{ fontSize: '16px', fontWeight: '600', color: 'hsl(var(--text-primary))' }}>All caught up!</p>
            <p style={{ fontSize: '13px', marginTop: '4px' }}>No pending result entries matching your criteria.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-dark)' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                      title="Select All Pending Results"
                    />
                  </th>
                  <th>ID</th>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Subject</th>
                  <th>Session & Term</th>
                  <th style={{ textAlign: 'center' }}>Breakdown (CA+Exam)</th>
                  <th style={{ textAlign: 'center' }}>Grade</th>
                  <th>Teacher</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingResults.map(result => {
                  const isChecked = selectedResultIds.includes(result.id);
                  return (
                    <tr 
                      key={result.id} 
                      className={isChecked ? 'bg-cyan-950/20' : ''}
                    >
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleSelectOne(result.id)}
                          className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
                        />
                      </td>
                      <td style={{ color: 'hsl(var(--text-secondary))', fontSize: '13px' }}>#{result.id}</td>
                      <td style={{ fontWeight: '600' }}>{result.student?.name}</td>
                      <td>{result.student?.class?.name || result.school_class?.name || 'N/A'}</td>
                      <td>{result.subject?.name}</td>
                      <td style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))' }}>
                        Term {result.term}
                        <br />
                        <span style={{ fontSize: '11px' }}>{result.academic_session}</span>
                      </td>
                      <td style={{ textAlign: 'center', fontSize: '13px' }}>
                        {result.ca_score} + {result.exam_score} = <span style={{ fontWeight: '800' }}>{result.total_score}</span>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: '800', color: '#00f2fe' }}>{result.grade}</td>
                      <td style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))' }}>{result.teacher?.name || 'N/A'}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          {/* Single Approve Button */}
                          <Button 
                            onClick={() => handleApprove(result.id)} 
                            disabled={actioningId === result.id}
                            className="btn-success"
                            size="sm"
                          >
                            {actioningId === result.id ? <span className="spinner spinner-sm"></span> : <CheckCircle2 size={14} />} Approve
                          </Button>

                          {/* Reject Modal Dialog */}
                          <Dialog 
                            open={isRejectModalOpen && rejectingResultId === result.id} 
                            onOpenChange={(open) => {
                              setIsRejectModalOpen(open);
                              if (!open) {
                                setRejectionReason("");
                                setRejectingResultId(null);
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <button 
                                type="button"
                                className="btn-reject"
                                onClick={() => {
                                  setRejectingResultId(result.id);
                                  setRejectionReason("");
                                  setIsRejectModalOpen(true);
                                }}
                              >
                                Reject
                              </button>
                            </DialogTrigger>
                            <DialogContent className="reject-modal-container">
                              <DialogHeader>
                                <DialogTitle className="reject-modal-title">Reason for Rejection</DialogTitle>
                              </DialogHeader>
                              <div style={{ marginTop: '8px', marginBottom: '16px' }}>
                                <p className="reject-modal-text">
                                  Please provide a clear explanation for rejecting result #{result.id} ({result.student?.name} - {result.subject?.name}):
                                </p>
                                <textarea 
                                  className="reject-textarea"
                                  placeholder="Enter reason for rejection..." 
                                  value={rejectionReason} 
                                  onChange={(e) => setRejectionReason(e.target.value)} 
                                  rows={4}
                                  required 
                                />
                              </div>
                              <div className="reject-modal-actions">
                                <button 
                                  type="button"
                                  className="btn-reject-cancel"
                                  onClick={() => {
                                    setIsRejectModalOpen(false);
                                    setRejectionReason("");
                                    setRejectingResultId(null);
                                  }}
                                >
                                  Cancel
                                </button>
                                <button 
                                  type="button"
                                  className="btn-reject-submit"
                                  disabled={!rejectionReason.trim() || actioningId === result.id} 
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleConfirmRejection(result.id, rejectionReason);
                                  }}
                                >
                                  {actioningId === result.id ? (
                                    <><span className="spinner spinner-sm"></span> Submitting...</>
                                  ) : (
                                    'Submit Reason'
                                  )}
                                </button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
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

export default Approvals;
