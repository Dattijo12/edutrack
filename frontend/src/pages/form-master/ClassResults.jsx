import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  ArrowLeft, ClipboardList, Layers, CheckCircle2, 
  AlertTriangle, X, MessageSquare, Save 
} from 'lucide-react';
import formMasterService from '../../services/formMasterService';
import examOfficerService from '../../services/examOfficerService';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const ClassResults = () => {
  const [assignedClass, setAssignedClass] = useState(null);
  const [broadsheetData, setBroadsheetData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Rejection Modal State variables as explicitly requested
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectingResult, setRejectingResult] = useState(null);
  const [submittingRejection, setSubmittingRejection] = useState(false);

  useEffect(() => {
    fetchClassResults();
  }, []);

  /**
   * Fetch assigned class and current broadsheet results data for Form Master.
   */
  const fetchClassResults = async () => {
    setLoading(true);
    try {
      const classData = await formMasterService.getAssignedClass();
      setAssignedClass(classData);

      if (classData && classData.id) {
        const broadsheet = await examOfficerService.getBroadsheet(classData.id);
        setBroadsheetData(broadsheet);
      }
    } catch (err) {
      console.error('Class results error:', err);
      toast.error('Failed to load class performance data.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Approve a student's score entry.
   */
  const handleApproveScore = async (resultId) => {
    try {
      await examOfficerService.approveResult(resultId);
      toast.success('Score approved!');
      fetchClassResults();
    } catch (err) {
      console.error('Approval error:', err);
      toast.error('Failed to approve score.');
    }
  };

  /**
   * Handle student score rejection submission to backend API.
   */
  const handleRejectSubmit = async (resultId, reason) => {
    if (!reason || !reason.trim()) {
      toast.warning('Please enter a valid reason for rejection.');
      return;
    }

    setSubmittingRejection(true);
    try {
      await examOfficerService.rejectResult(resultId, reason);
      toast.success('Score rejected and returned for teacher correction.');
      fetchClassResults();
    } catch (err) {
      console.error('Rejection error:', err);
      toast.error(err?.response?.data?.message || 'Failed to reject score.');
    } finally {
      setSubmittingRejection(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }} className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '32px' }}>
        
        {/* Header Section */}
        <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-dark)', paddingBottom: '16px' }}>
          <Link to="/dashboard" className="back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--text-secondary))', textDecoration: 'none', marginBottom: '12px' }}>
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(0, 242, 254, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ClipboardList size={22} color="#00f2fe" />
              </div>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: '800' }}>
                  Form Master Class Results {assignedClass ? `— ${assignedClass.name} ${assignedClass.arm}` : ''}
                </h2>
                <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '14px' }}>
                  Review overall academic performance, verify subject scores, and approve or reject score submissions.
                </p>
              </div>
            </div>

            <Link to="/form-master/remarks" className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <Save size={16} /> Form Master Remarks & Endorsements
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="page-loading">
            <span className="spinner"></span>
            <p>Loading class results data...</p>
          </div>
        ) : !broadsheetData || !broadsheetData.broadsheet || broadsheetData.broadsheet.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px', textAlign: 'center' }}>
            <ClipboardList size={48} color="#00f2fe" style={{ opacity: 0.5, marginBottom: '12px' }} />
            <p style={{ fontSize: '16px', fontWeight: '600' }}>No Score Data Available</p>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '13px' }}>
              Subject teachers have not submitted score entries for this class term yet.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-dark)' }}>
            <table className="data-table" style={{ fontSize: '13px' }}>
              <thead>
                <tr>
                  <th>S/N</th>
                  <th>Student Name</th>
                  <th>Adm #</th>
                  {broadsheetData.subjects?.map(sub => (
                    <th key={sub.id} style={{ textAlign: 'center' }}>
                      {sub.name}<br/>
                      <span style={{ fontSize: '10px', opacity: 0.7 }}>(CA / Exam)</span>
                    </th>
                  ))}
                  <th style={{ textAlign: 'center' }}>Total</th>
                  <th style={{ textAlign: 'center' }}>Avg (%)</th>
                  <th style={{ textAlign: 'center' }}>Pos</th>
                </tr>
              </thead>
              <tbody>
                {broadsheetData.broadsheet?.map((row, idx) => (
                  <tr key={row.student.id}>
                    <td>{idx + 1}</td>
                    <td style={{ fontWeight: '700' }}>{row.student.name}</td>
                    <td>{row.student.admission_number}</td>
                    {broadsheetData.subjects?.map(sub => {
                      const score = row.scores[sub.id];
                      return (
                        <td key={sub.id} style={{ textAlign: 'center' }}>
                          {score ? (
                            <div>
                              <div>{score.ca} + {score.exam} = <strong>{score.total}</strong> ({score.grade})</div>
                              {score.approval_status === 'needs_correction' && (
                                <div style={{ color: '#ff4b4b', fontSize: '10px', fontWeight: 'bold', marginTop: '2px' }}>
                                  ⚠️ Needs Correction
                                </div>
                              )}
                              {score.id && (
                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginTop: '4px' }}>
                                  {score.approval_status !== 'approved' && (
                                    <button 
                                      onClick={() => handleApproveScore(score.id)}
                                      title="Approve Score"
                                      style={{ background: '#00e676', color: '#000', border: 'none', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', fontSize: '10px', fontWeight: 'bold' }}
                                    >
                                      ✓ Approve
                                    </button>
                                  )}
                                  {score.approval_status !== 'needs_correction' && (
                                    <Dialog open={isRejectModalOpen && rejectingResult?.id === score.id} onOpenChange={(open) => {
                                      setIsRejectModalOpen(open);
                                      if (open) {
                                        setRejectingResult(score);
                                        setRejectionReason("");
                                      } else {
                                        setRejectingResult(null);
                                      }
                                    }}>
                                      <DialogTrigger asChild>
                                        <Button variant="destructive" size="sm" onClick={() => {
                                          setRejectingResult(score);
                                          setRejectionReason("");
                                          setIsRejectModalOpen(true);
                                        }}>
                                          Reject
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent>
                                        <DialogHeader>
                                          <DialogTitle>Reason for Rejection</DialogTitle>
                                        </DialogHeader>
                                        <Textarea 
                                          placeholder="Enter reason..." 
                                          value={rejectionReason} 
                                          onChange={(e) => setRejectionReason(e.target.value)} 
                                          className="mb-4"
                                          required 
                                        />
                                        <Button 
                                          variant="destructive" 
                                          disabled={!rejectionReason.trim() || submittingRejection} 
                                          onClick={async () => {
                                            if (rejectingResult) {
                                              await handleRejectSubmit(rejectingResult.id, rejectionReason);
                                            }
                                            setIsRejectModalOpen(false);
                                            setRejectionReason("");
                                          }}
                                        >
                                          {submittingRejection ? "Submitting..." : "Confirm Rejection"}
                                        </Button>
                                      </DialogContent>
                                    </Dialog>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: 'hsl(var(--text-secondary))' }}>-</span>
                          )}
                        </td>
                      );
                    })}
                    <td style={{ textAlign: 'center', fontWeight: '700' }}>{row.total_marks}</td>
                    <td style={{ textAlign: 'center', fontWeight: '700' }}>{row.average}%</td>
                    <td style={{ textAlign: 'center', fontWeight: '800', color: '#7b93ff' }}>{row.class_position_formatted}</td>
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

export default ClassResults;
