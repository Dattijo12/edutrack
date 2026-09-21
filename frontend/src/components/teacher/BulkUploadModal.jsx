import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Upload, Download, FileText, AlertTriangle, CheckCircle2, X, Loader2 } from 'lucide-react';
import resultService from '../../services/resultService';

/**
 * BulkUploadModal Component
 * Provides a shadcn/ui inspired glassmorphism modal for uploading CSV result files.
 * Features row-level error reporting, downloadable pre-filled templates, and progress states.
 */
const BulkUploadModal = ({ isOpen, onClose, selectedSubject, selectedClass, term, session, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [errorSummary, setErrorSummary] = useState(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.txt')) {
        toast.error('Please select a valid CSV or TXT file.');
        return;
      }
      setFile(selectedFile);
      setErrorSummary(null);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setDownloadingTemplate(true);
      await resultService.downloadTemplate(selectedClass);
      toast.success('Result entry CSV template downloaded!');
    } catch (err) {
      console.error('Failed to download template:', err);
      toast.error('Failed to download template. Please try again.');
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      toast.error('Please select a CSV file to upload.');
      return;
    }
    if (!selectedSubject) {
      toast.error('Please select a Subject first before uploading results.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('subject_id', selectedSubject);
    formData.append('term', term);
    formData.append('academic_session', session);

    try {
      setUploading(true);
      setErrorSummary(null);

      const res = await resultService.bulkUploadResults(formData);

      if (res.error_count > 0) {
        setErrorSummary({
          processedCount: res.processed_count,
          errorCount: res.error_count,
          errors: res.errors || [],
        });
        toast.warning(`Processed ${res.processed_count} rows with ${res.error_count} error(s). Review error summary below.`);
      } else {
        toast.success(res.message || 'All student results uploaded and saved successfully!');
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err) {
      console.error('Bulk upload error:', err);
      const msg = err?.response?.data?.message || 'Failed to process bulk upload file.';
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
      <div className="modal-content glass-panel animate-scale-in" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', borderRadius: '16px', border: '1px solid var(--border-dark)', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid var(--border-dark)', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(123, 147, 255, 0.15)', color: '#7b93ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Upload size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '700' }}>CSV Gradebook Bulk Upload</h3>
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', marginTop: '2px' }}>
                Batch import student CA and Exam scores via CSV spreadsheet
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'hsl(var(--text-secondary))', cursor: 'pointer', padding: '4px' }}>
            <X size={20} />
          </button>
        </div>

        {/* Action / Template Download Banner */}
        <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(0, 230, 118, 0.06)', border: '1px solid rgba(0, 230, 118, 0.2)', marginBottom: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <h4 style={{ fontSize: '14px', fontWeight: '600', color: '#00e676' }}>Need a formatted file?</h4>
            <p style={{ fontSize: '12px', color: 'hsl(var(--text-secondary))', marginTop: '2px' }}>
              Download pre-filled template containing student admission numbers.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            disabled={downloadingTemplate}
            className="btn-primary"
            style={{ padding: '8px 14px', fontSize: '13px', whiteSpace: 'nowrap' }}
          >
            {downloadingTemplate ? (
              <Loader2 size={14} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <><Download size={14} /> Download Template</>
            )}
          </button>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '24px' }}>
            <label className="form-label">Select CSV File</label>
            <div style={{ border: '2px dashed var(--border-dark)', borderRadius: '12px', padding: '30px 20px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', cursor: 'pointer', transition: 'border-color 0.2s' }}>
              <input
                type="file"
                accept=".csv, .txt"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="csv-file-input"
              />
              <label htmlFor="csv-file-input" style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <FileText size={36} color="#7b93ff" style={{ opacity: 0.8 }} />
                {file ? (
                  <div>
                    <p style={{ fontWeight: '600', fontSize: '15px', color: '#7b93ff' }}>{file.name}</p>
                    <p style={{ fontSize: '12px', color: 'hsl(var(--text-secondary))', marginTop: '4px' }}>
                      {(file.size / 1024).toFixed(1)} KB — Click to change file
                    </p>
                  </div>
                ) : (
                  <div>
                    <p style={{ fontWeight: '600', fontSize: '14px' }}>Click to browse or drag & drop CSV file</p>
                    <p style={{ fontSize: '12px', color: 'hsl(var(--text-secondary))', marginTop: '4px' }}>
                      Headers: <code>admission_number</code>, <code>student_name</code>, <code>ca_score</code>, <code>exam_score</code>
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Error Summary Box */}
          {errorSummary && (
            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255, 59, 59, 0.08)', border: '1px solid rgba(255, 59, 59, 0.3)', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <AlertTriangle size={18} color="#ff6b6b" />
                <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#ff6b6b' }}>
                  Upload Completed with Warnings ({errorSummary.errorCount} Error(s))
                </h4>
              </div>
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', marginBottom: '12px' }}>
                {errorSummary.processedCount} row(s) were successfully saved. Please review the row-level errors below to correct remaining records:
              </p>
              <div style={{ maxHeight: '140px', overflowY: 'auto', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,59,59,0.2)' }}>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#ff8e8e', lineHeight: '1.6' }}>
                  {errorSummary.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" onClick={onClose} className="btn-cancel" disabled={uploading}>
              Close
            </button>
            <button type="submit" className="btn-primary" disabled={!file || uploading}>
              {uploading ? (
                <><Loader2 size={16} className="spinner" style={{ animation: 'spin 1s linear infinite' }} /> Processing File...</>
              ) : (
                <><CheckCircle2 size={16} /> Process & Save CSV</>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default BulkUploadModal;
