import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  ArrowLeft, FileSpreadsheet, FileText, Printer, Lock, 
  CheckCircle2, AlertTriangle, X, MessageSquare 
} from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import examOfficerService from '../../services/examOfficerService';
import classService from '../../services/classService';
import studentService from '../../services/studentService';

const Broadsheet = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [viewMode, setViewMode] = useState('broadsheet'); // 'broadsheet' or 'report_card'
  
  const [broadsheetData, setBroadsheetData] = useState(null);
  const [reportCardData, setReportCardData] = useState(null);
  const [studentsInClass, setStudentsInClass] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const [loading, setLoading] = useState(false);

  // Global Rejection Dialog States
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectingResult, setRejectingResult] = useState(null);
  const [submittingRejection, setSubmittingRejection] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const data = await examOfficerService.getClasses();
      const classList = Array.isArray(data) ? data : (data?.data || []);
      setClasses(classList);
    } catch (err) {
      console.warn('Exam Officer getClasses failed, trying classService fallback:', err);
      try {
        const data = await classService.getAll();
        setClasses(Array.isArray(data) ? data : (data?.data || []));
      } catch (fallbackErr) {
        console.error('Failed to load class list:', fallbackErr);
        toast.error('Failed to load available classes.');
      }
    }
  };

  useEffect(() => {
    if (selectedClass) {
      setBroadsheetData(null);
      setReportCardData(null);

      examOfficerService.getStudentsByClass(selectedClass)
        .then(data => setStudentsInClass(Array.isArray(data) ? data : (data?.data || [])))
        .catch(err => {
          console.warn('Exam Officer getStudentsByClass failed, attempting studentService fallback:', err);
          studentService.getByClass(selectedClass)
            .then(data => setStudentsInClass(Array.isArray(data) ? data : (data?.data || [])))
            .catch(fallbackErr => {
              console.error('Failed to load student roster for class:', fallbackErr);
              setStudentsInClass([]);
            });
        });
    } else {
      setStudentsInClass([]);
      setSelectedStudentId('');
    }
  }, [selectedClass]);

  const handleGenerateBroadsheet = async () => {
    if (!selectedClass) {
      toast.warning('Please select a class arm from the dropdown first.');
      return;
    }
    setLoading(true);
    setReportCardData(null);
    try {
      const data = await examOfficerService.getBroadsheet(selectedClass);
      setBroadsheetData(data);
      toast.success('Class Broadsheet generated successfully!');
    } catch (err) {
      console.error('Broadsheet generation error:', err);
      toast.error(err?.response?.data?.message || 'Failed to generate class broadsheet.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReportCard = async () => {
    if (!selectedStudentId) {
      toast.warning('Please select a student from the dropdown first.');
      return;
    }
    setLoading(true);
    setBroadsheetData(null);
    try {
      const data = await examOfficerService.getReportCard(selectedStudentId);
      setReportCardData(data);
      toast.success('Report card generated successfully!');
    } catch (err) {
      console.error('Report card generation error:', err);
      if (err?.response?.data?.locked) {
        setReportCardData({ 
          locked: true, 
          message: err.response.data.message, 
          student: err.response.data.student 
        });
        toast.warning('Report card is locked due to outstanding fee balance.');
      } else {
        toast.error(err?.response?.data?.message || 'Failed to generate student report card.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApproveScore = async (resultId) => {
    try {
      await examOfficerService.approveResult(resultId);
      toast.success('Score approved!');
      handleGenerateBroadsheet();
    } catch (err) {
      console.error('Approval failed:', err);
      toast.error('Failed to approve score.');
    }
  };

  const handleRejectSubmit = async (resultId, reason) => {
    if (!reason || !reason.trim()) {
      toast.warning('Please enter a valid reason for rejection.');
      return;
    }

    setSubmittingRejection(true);
    try {
      await examOfficerService.rejectResult(resultId, reason);
      toast.success('Score rejected and returned to Subject Teacher with notes.');
      handleGenerateBroadsheet();
    } catch (err) {
      console.error('Rejection failed:', err);
      toast.error(err?.response?.data?.message || 'Failed to reject score.');
    } finally {
      setSubmittingRejection(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Function to open the modal for a specific score
  const openRejectModal = (score) => {
    setRejectingResult(score);
    setRejectionReason("");
    setIsRejectModalOpen(true);
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }} className="animate-fade-in">
      
      {/* Control Panel (Hidden on Print) */}
      <div className="glass-panel no-print" style={{ padding: '35px', marginBottom: '30px' }}>
        <Link to="/dashboard" className="back-link">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <h2 style={{ fontSize: '28px', fontWeight: '700', marginTop: '12px', marginBottom: '8px' }}>
          1-Click Broadsheets & Student Report Cards
        </h2>
        <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '14px', marginBottom: '24px' }}>
          Generate print-ready A4 Broadsheets or individual Report Cards featuring WAEC/NECO grades, fee clearance gatekeeper, human approval workflows, and QR code verification.
        </p>

        {/* View Mode Switcher */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setViewMode('broadsheet')} 
            className={viewMode === 'broadsheet' ? 'btn-primary' : 'btn-secondary'}
          >
            <FileSpreadsheet size={16} /> Class Broadsheet Grid (A4 Landscape)
          </button>
          <button 
            onClick={() => setViewMode('report_card')} 
            className={viewMode === 'report_card' ? 'btn-primary' : 'btn-secondary'}
          >
            <FileText size={16} /> Individual Student Report Card
          </button>
        </div>

        {/* Filters Grid */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', background: 'rgba(0,0,0,0.15)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-dark)' }}>
          
          <div style={{ minWidth: '240px' }}>
            <Select value={selectedClass} onValueChange={(val) => setSelectedClass(val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Class Arm" />
              </SelectTrigger>
              <SelectContent>
                {classes.map(c => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.name} {c.arm}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {viewMode === 'report_card' && (
            <div style={{ minWidth: '260px' }}>
              <Select 
                value={selectedStudentId} 
                onValueChange={(val) => setSelectedStudentId(val)}
                disabled={!selectedClass}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedClass ? "Select Student" : "Select Class First"} />
                </SelectTrigger>
                <SelectContent>
                  {studentsInClass.map(s => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.first_name ? `${s.first_name} ${s.last_name}` : s.name} ({s.admission_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {viewMode === 'broadsheet' ? (
            <button onClick={handleGenerateBroadsheet} className="btn-primary" disabled={!selectedClass || loading}>
              {loading ? <><span className="spinner spinner-sm"></span> Generating...</> : <><FileSpreadsheet size={16} /> Generate Broadsheet</>}
            </button>
          ) : (
            <button onClick={handleGenerateReportCard} className="btn-primary" disabled={!selectedStudentId || loading}>
              {loading ? <><span className="spinner spinner-sm"></span> Generating...</> : <><FileText size={16} /> Generate Report Card</>}
            </button>
          )}

          {(broadsheetData || (reportCardData && !reportCardData.locked)) && (
            <button onClick={handlePrint} className="btn-secondary" style={{ marginLeft: 'auto' }}>
              <Printer size={16} /> Print / Export PDF
            </button>
          )}
        </div>
      </div>

      {/* PRINTABLE BROADSHEET AREA */}
      {viewMode === 'broadsheet' && broadsheetData && (
        <div className="printable-area animate-fade-in" style={{ background: '#fff', color: '#000', padding: '30px', borderRadius: '12px' }}>
          <div style={{ textAlign: 'center', marginBottom: '25px', borderBottom: '2px solid #222', paddingBottom: '15px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '800', textTransform: 'uppercase', margin: 0 }}>{broadsheetData.school?.name}</h1>
            <p style={{ fontSize: '12px', color: '#444' }}>{broadsheetData.school?.address} | {broadsheetData.school?.phone}</p>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginTop: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              OFFICIAL CLASS MASTER BROADSHEET — {broadsheetData.class?.name} {broadsheetData.class?.arm} ({broadsheetData.term}, {broadsheetData.session})
            </h3>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'center' }}>
              <thead>
                <tr style={{ background: '#f0f2f5', border: '1px solid #000' }}>
                  <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>S/N</th>
                  <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>Student Name</th>
                  <th style={{ border: '1px solid #000', padding: '6px' }}>Adm No</th>
                  {broadsheetData.subjects?.map(sub => (
                    <th key={sub.id} style={{ border: '1px solid #000', padding: '4px' }}>
                      {sub.code}<br/><span style={{ fontSize: '9px', fontWeight: 'normal' }}>CA | EX | TOT</span>
                    </th>
                  ))}
                  <th style={{ border: '1px solid #000', padding: '6px' }}>Total</th>
                  <th style={{ border: '1px solid #000', padding: '6px' }}>Avg (%)</th>
                  <th style={{ border: '1px solid #000', padding: '6px' }}>Pos</th>
                </tr>
              </thead>
              <tbody>
                {broadsheetData.broadsheet?.map((row, idx) => (
                  <tr key={row.student.id} style={{ border: '1px solid #000', background: idx % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'left' }}>{idx + 1}</td>
                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'left', fontWeight: 'bold' }}>{row.student.name}</td>
                    <td style={{ border: '1px solid #000', padding: '6px' }}>{row.student.admission_number}</td>
                    {broadsheetData.subjects?.map(sub => {
                      const score = row.scores[sub.id];
                      return (
                        <td key={sub.id} style={{ border: '1px solid #000', padding: '4px' }}>
                          {score ? (
                            <div>
                              <div>{score.ca} | {score.exam} | <strong>{score.total}</strong></div>
                              {score.approval_status === 'needs_correction' && (
                                <div style={{ color: '#d32f2f', fontSize: '9px', fontWeight: 'bold', marginTop: '2px' }} className="no-print">
                                  ⚠️ Needs Correction
                                </div>
                              )}
                              {score.id && (
                                <div className="no-print" style={{ display: 'flex', gap: '4px', justifyContent: 'center', marginTop: '4px' }}>
                                  {score.approval_status !== 'approved' && (
                                    <button 
                                      onClick={() => handleApproveScore(score.id)}
                                      title="Approve Score"
                                      style={{ background: '#2e7d32', color: '#fff', border: 'none', borderRadius: '3px', padding: '2px 4px', cursor: 'pointer', fontSize: '9px' }}
                                    >
                                      ✓
                                    </button>
                                  )}
                                  {score.approval_status !== 'needs_correction' && (
                                    <Button 
                                      variant="destructive" 
                                      size="sm" 
                                      className="h-6 text-[10px] px-2"
                                      onClick={() => openRejectModal(score)}
                                    >
                                      Reject
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : '-'}
                        </td>
                      );
                    })}
                    <td style={{ border: '1px solid #000', padding: '6px', fontWeight: 'bold' }}>{row.total_marks}</td>
                    <td style={{ border: '1px solid #000', padding: '6px', fontWeight: 'bold' }}>{row.average}%</td>
                    <td style={{ border: '1px solid #000', padding: '6px', fontWeight: 'bold', color: '#0055ff' }}>{row.class_position_formatted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PRINTABLE REPORT CARD AREA */}
      {viewMode === 'report_card' && reportCardData && (
        reportCardData.locked ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', border: '1px solid #ff4b4b', background: 'rgba(255,75,75,0.1)' }}>
            <Lock size={48} color="#ff4b4b" style={{ marginBottom: '12px' }} />
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#ff4b4b', marginBottom: '10px' }}>
              REPORT CARD LOCKED (FEE GATEKEEPER)
            </h2>
            <p style={{ fontSize: '15px', color: 'hsl(var(--text-primary))', maxWidth: '600px', margin: '0 auto 20px auto' }}>
              {reportCardData.message}
            </p>
            <div style={{ display: 'inline-block', padding: '12px 20px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', fontSize: '14px' }}>
              Student: <strong>{reportCardData.student?.name}</strong> ({reportCardData.student?.class_name})
            </div>
          </div>
        ) : (
          <div className="printable-area animate-fade-in" style={{ background: '#fff', color: '#000', padding: '40px', borderRadius: '12px', border: '2px solid #000' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000', paddingBottom: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {reportCardData.school?.logo_url && (
                  <img 
                    src={reportCardData.school.logo_url} 
                    alt={reportCardData.school.name} 
                    style={{ maxHeight: '64px', objectFit: 'contain' }} 
                  />
                )}
                <div>
                  <h1 style={{ fontSize: '24px', fontWeight: '800', textTransform: 'uppercase', margin: 0 }}>{reportCardData.school?.name}</h1>
                  <p style={{ fontSize: '12px', margin: '2px 0' }}>{reportCardData.school?.address}</p>
                  <p style={{ fontSize: '12px', margin: 0 }}>Phone: {reportCardData.school?.phone} | Email: {reportCardData.school?.email}</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <h3 style={{ fontSize: '18px', fontWeight: '800', textTransform: 'uppercase', color: '#1a237e' }}>STUDENT REPORT CARD</h3>
                <p style={{ fontSize: '13px', fontWeight: 'bold' }}>{reportCardData.term} ({reportCardData.session})</p>
              </div>
            </div>

            {/* Student Info Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', border: '1px solid #000', padding: '15px', borderRadius: '4px', marginBottom: '25px', fontSize: '13px' }}>
              <div><strong>Name:</strong> {reportCardData.student?.name}</div>
              <div><strong>Admission No:</strong> {reportCardData.student?.admission_number}</div>
              <div><strong>Class:</strong> {reportCardData.student?.class_name}</div>
              <div><strong>Gender:</strong> {reportCardData.student?.gender || 'N/A'}</div>
              <div><strong>Attendance:</strong> {reportCardData.summary?.attendance}</div>
              <div><strong>Fee Status:</strong> <span style={{ color: 'green', fontWeight: 'bold' }}>CLEARED</span></div>
            </div>

            {/* Scores Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', marginBottom: '25px' }}>
              <thead>
                <tr style={{ background: '#e8eaf6', border: '1px solid #000' }}>
                  <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Subject</th>
                  <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>CA ({reportCardData.school?.max_ca_score || 30})</th>
                  <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>Exam ({reportCardData.school?.max_exam_score || 70})</th>
                  <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>Total (100)</th>
                  <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>Grade (WAEC)</th>
                  <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Remark</th>
                </tr>
              </thead>
              <tbody>
                {reportCardData.results?.map(r => (
                  <tr key={r.id} style={{ border: '1px solid #000' }}>
                    <td style={{ border: '1px solid #000', padding: '8px', fontWeight: 'bold' }}>{r.subject?.name}</td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{r.ca_score}</td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{r.exam_score}</td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>{r.total_score}</td>
                    <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center', fontWeight: 'bold', color: '#1a237e' }}>{r.grade}</td>
                    <td style={{ border: '1px solid #000', padding: '8px' }}>{r.remark}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Performance Summary & Remarks */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '25px' }}>
              <div style={{ border: '1px solid #000', padding: '15px', borderRadius: '4px', fontSize: '12px' }}>
                <p style={{ marginBottom: '8px' }}><strong>Form Master's Remark:</strong> {reportCardData.summary?.form_master_remark}</p>
                <p><strong>Principal's Remark:</strong> {reportCardData.summary?.principal_remark}</p>
              </div>

              <div style={{ border: '1px solid #000', padding: '15px', borderRadius: '4px', textAlign: 'center', fontSize: '13px' }}>
                <p><strong>Total Marks:</strong> {reportCardData.summary?.total_marks}</p>
                <p style={{ marginTop: '6px', fontSize: '16px', fontWeight: '800', color: '#1a237e' }}>Average: {reportCardData.summary?.average}%</p>
              </div>
            </div>

            {/* QR Verification & Signature Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px solid #000', paddingTop: '15px', marginTop: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ border: '2px solid #000', padding: '4px', background: '#fff', borderRadius: '4px', textAlign: 'center', width: '80px', height: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  {reportCardData.qr_code ? (
                    <img src={reportCardData.qr_code} alt="QR Code Verification" style={{ width: '70px', height: '70px', objectFit: 'contain' }} />
                  ) : (
                    <>
                      <CheckCircle2 size={32} color="#0d9c3f" />
                      <span style={{ fontSize: '8px', fontWeight: 'bold', marginTop: '2px' }}>QR VERIFIED</span>
                    </>
                  )}
                </div>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 'bold', margin: 0 }}>ANTI-FORGERY QR VERIFICATION</p>
                  <p style={{ fontSize: '10px', color: '#555', wordBreak: 'break-all', maxWidth: '300px', margin: '2px 0' }}>
                    Code: {reportCardData.verification_hash}
                  </p>
                  <a href={reportCardData.verification_url} target="_blank" rel="noreferrer" style={{ fontSize: '10px', color: '#0055ff' }}>
                    Verify authenticity online
                  </a>
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ height: '40px', borderBottom: '1px solid #000', width: '160px', margin: '0 auto 4px auto' }}></div>
                <p style={{ fontSize: '11px', fontWeight: 'bold', margin: 0 }}>Principal Signature & Stamp</p>
              </div>
            </div>

          </div>
        )
      )}

      {/* GLOBAL REJECTION MODAL */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reason for Rejection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea 
              placeholder="Enter specific reason for rejecting this score..." 
              value={rejectionReason} 
              onChange={(e) => setRejectionReason(e.target.value)} 
              className="min-h-[100px]"
              required 
            />
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsRejectModalOpen(false)}>
                Cancel
              </Button>
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
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Broadsheet;