import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, FileCheck2, CheckCircle2, CheckCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import examOfficerService from '../../services/examOfficerService';

const Approvals = () => {
  const [pendingResults, setPendingResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);

  // Rejection modal state variables as required by design specification
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectingResultId, setRejectingResultId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetchPending();
  }, []);

  /**
   * Fetch all pending result submissions awaiting exam officer approval.
   */
  const fetchPending = async () => {
    setLoading(true);
    try {
      const data = await examOfficerService.getPendingResults();
      setPendingResults(data);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load pending results.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Approve a pending student result entry.
   *
   * @param {number|string} id - Result record primary key
   */
  const handleApprove = async (id) => {
    setActioningId(id);
    try {
      await examOfficerService.approveResult(id);
      toast.success(`Result #${id} approved successfully!`);
      setPendingResults(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error(error);
      toast.error(`Failed to approve result.`);
    } finally {
      setActioningId(null);
    }
  };

  /**
   * Submit result rejection feedback to the backend service.
   * Triggers API rejection call, updates local UI state, and closes modal dialog.
   *
   * @param {number|string} id - Result record primary key
   * @param {string} reason - Rejection explanation note
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

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }} className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '40px' }}>
        
        {/* Header Section */}
        <div style={{ marginBottom: '30px', borderBottom: '1px solid var(--border-dark)', paddingBottom: '20px' }}>
          <Link to="/dashboard" className="back-link">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(0, 242, 254, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileCheck2 size={22} color="#00f2fe" />
            </div>
            <div>
              <h2 style={{ fontSize: '28px', fontWeight: '700' }}>Pending Grade Approvals</h2>
              <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '14px', marginTop: '2px' }}>
                Review and verify teacher-submitted student grades.
              </p>
            </div>
          </div>
        </div>

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
            <p style={{ fontSize: '13px', marginTop: '4px' }}>No pending result entries requiring approval right now.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-dark)' }}>
            <table className="data-table">
              <thead>
                <tr>
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
                {pendingResults.map(result => (
                  <tr key={result.id}>
                    <td style={{ color: 'hsl(var(--text-secondary))', fontSize: '13px' }}>#{result.id}</td>
                    <td style={{ fontWeight: '600' }}>{result.student?.name}</td>
                    <td>{result.student?.class?.name}</td>
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
                    <td style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))' }}>{result.teacher?.name}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {/* Approve Button */}
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
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => {
                                setRejectingResultId(result.id);
                                setRejectionReason("");
                                setIsRejectModalOpen(true);
                              }}
                            >
                              Reject
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Reason for Rejection</DialogTitle>
                            </DialogHeader>
                            <div style={{ marginTop: '12px', marginBottom: '16px' }}>
                              <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', marginBottom: '8px' }}>
                                Please provide a clear explanation for rejecting result #{result.id} ({result.student?.name} - {result.subject?.name}):
                              </p>
                              <Textarea 
                                placeholder="Enter reason for rejection..." 
                                value={rejectionReason} 
                                onChange={(e) => setRejectionReason(e.target.value)} 
                                rows={4}
                                required 
                              />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => {
                                  setIsRejectModalOpen(false);
                                  setRejectionReason("");
                                  setRejectingResultId(null);
                                }}
                              >
                                Cancel
                              </Button>
                              <Button 
                                variant="destructive" 
                                size="sm"
                                disabled={!rejectionReason.trim() || actioningId === result.id} 
                                onClick={() => handleConfirmRejection(result.id, rejectionReason)}
                              >
                                {actioningId === result.id ? <span className="spinner spinner-sm"></span> : 'Confirm Rejection'}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Approvals;
