import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';
import { 
  ArrowLeft, Upload, Download, FileSpreadsheet, Users, 
  ClipboardList, CheckCircle2, AlertTriangle, Trash2 
} from 'lucide-react';
import bulkUploadService from '../../services/bulkUploadService';

const BulkUpload = () => {
  const [activeTab, setActiveTab] = useState('students');
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [summary, setSummary] = useState(null);
  const fileInputRef = useRef(null);

  const downloadTemplate = () => {
    if (activeTab === 'students') {
      const ws = XLSX.utils.aoa_to_sheet([
        ['Full Name', 'Admission Number', 'Gender', 'Date of Birth', 'Class ID', 'Parent Phone'],
        ['John Doe', 'STU/2024/001', 'Male', '2010-05-15', '1', '+2348012345678']
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Students');
      XLSX.writeFile(wb, 'student_upload_template.xlsx');
    } else {
      const ws = XLSX.utils.aoa_to_sheet([
        ['Admission Number', 'Student Name', 'Subject ID', 'CA1', 'CA2', 'Exam Score'],
        ['STU/2024/001', 'John Doe', '1', '15', '14', '60']
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Results');
      XLSX.writeFile(wb, 'result_upload_template.xlsx');
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const processFile = (fileToProcess) => {
    if (!fileToProcess.name.match(/\.(xlsx|csv)$/)) {
      toast.error('Invalid file type. Please upload a .xlsx or .csv file');
      return;
    }
    setFile(fileToProcess);
    setSummary(null);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        setParsedData(jsonData);
      } catch (err) {
        toast.error('Error parsing file.');
        console.error(err);
      }
    };
    reader.readAsArrayBuffer(fileToProcess);
  };

  const clearFile = () => {
    setFile(null);
    setParsedData([]);
    setSummary(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (parsedData.length === 0) {
      toast.error('No data to upload.');
      return;
    }
    setIsUploading(true);

    try {
      if (activeTab === 'students') {
        const mapped = parsedData.map(row => ({
          name: row['Full Name'],
          admission_number: row['Admission Number'],
          gender: row['Gender'],
          dob: row['Date of Birth'],
          class_id: parseInt(row['Class ID'], 10),
          parent_phone: row['Parent Phone'] || null
        }));
        
        const res = await bulkUploadService.uploadStudents(mapped);
        setSummary({
          inserted: res.inserted || 0,
          skipped: res.skipped || 0,
          error: res.error || 0
        });
        toast.success('Student upload completed.');
      } else {
        const mapped = parsedData.map(row => ({
          admission_number: row['Admission Number'],
          subject_id: parseInt(row['Subject ID'], 10),
          ca1: parseFloat(row['CA1']) || 0,
          ca2: parseFloat(row['CA2']) || 0,
          exam_score: parseFloat(row['Exam Score']) || 0
        }));
        
        const res = await bulkUploadService.uploadResults(mapped);
        setSummary({
          upserted: res.upserted || 0,
          error: res.error || 0
        });
        toast.success('Result upload completed.');
      }
    } catch (err) {
      toast.error('Failed to upload data.');
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '24px' }}>
        <Link to="/admin/dashboard" style={{ color: 'hsl(var(--text-secondary))', display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none' }}>
          <ArrowLeft size={18} /> Back
        </Link>
        <h1 style={{ fontSize: '24px', fontWeight: '700' }}>Bulk Data Upload</h1>
      </div>

      <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border-dark)', background: 'rgba(255,255,255,0.02)' }}>
          <button
            onClick={() => { setActiveTab('students'); clearFile(); }}
            style={{
              flex: 1, padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px',
              background: activeTab === 'students' ? 'rgba(123, 147, 255, 0.1)' : 'transparent',
              borderBottom: activeTab === 'students' ? '3px solid #7b93ff' : '3px solid transparent',
              color: activeTab === 'students' ? '#7b93ff' : 'hsl(var(--text-secondary))',
              fontWeight: '600', transition: 'all 0.3s'
            }}
          >
            <Users size={20} /> Student Upload
          </button>
          <button
            onClick={() => { setActiveTab('results'); clearFile(); }}
            style={{
              flex: 1, padding: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px',
              background: activeTab === 'results' ? 'rgba(0, 242, 254, 0.1)' : 'transparent',
              borderBottom: activeTab === 'results' ? '3px solid #00f2fe' : '3px solid transparent',
              color: activeTab === 'results' ? '#00f2fe' : 'hsl(var(--text-secondary))',
              fontWeight: '600', transition: 'all 0.3s'
            }}
          >
            <ClipboardList size={20} /> Result Upload
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <p style={{ color: 'hsl(var(--text-secondary))' }}>
              {activeTab === 'students' 
                ? 'Batch register students. Existing admission numbers will be skipped.' 
                : 'Batch upload exam results. Existing records will be updated.'}
            </p>
            <button className="btn-cancel" onClick={downloadTemplate} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Download size={18} /> Download Template
            </button>
          </div>

          <div 
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            style={{
              border: '2px dashed var(--border-dark)', borderRadius: '12px', padding: '40px',
              textAlign: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.02)',
              transition: 'all 0.3s', marginBottom: '24px'
            }}
            onClick={() => fileInputRef.current.click()}
          >
            <FileSpreadsheet size={48} color={activeTab === 'students' ? '#7b93ff' : '#00f2fe'} style={{ marginBottom: '16px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
              Drag & Drop your file here
            </h3>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '14px', marginBottom: '16px' }}>
              Supports .xlsx and .csv formats
            </p>
            <button className="btn-primary" style={{ pointerEvents: 'none' }}>
              Browse Files
            </button>
            <input 
              type="file" 
              accept=".xlsx,.csv" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              onChange={handleFileChange} 
            />
          </div>

          {file && (
            <div className="glass-panel" style={{ padding: '16px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FileSpreadsheet size={24} color="#00f2fe" />
                <div>
                  <p style={{ fontWeight: '600' }}>{file.name}</p>
                  <p style={{ fontSize: '12px', color: 'hsl(var(--text-secondary))' }}>{parsedData.length} rows found</p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn-cancel" onClick={clearFile} disabled={isUploading}>
                  <Trash2 size={18} />
                </button>
                <button className="btn-primary" onClick={handleUpload} disabled={isUploading} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isUploading ? <span className="spinner" style={{ width: '16px', height: '16px', borderTopColor: 'white' }}></span> : <Upload size={18} />}
                  {isUploading ? 'Uploading...' : 'Upload Data'}
                </button>
              </div>
            </div>
          )}

          {summary && (
            <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px', background: 'rgba(255,255,255,0.03)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '16px' }}>Upload Summary</h3>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                {(summary.inserted !== undefined || summary.upserted !== undefined) && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00e676', background: 'rgba(0,230,118,0.1)', padding: '10px 16px', borderRadius: '8px' }}>
                    <CheckCircle2 size={20} />
                    <span style={{ fontWeight: '600' }}>{summary.inserted !== undefined ? summary.inserted : summary.upserted} Success</span>
                  </div>
                )}
                {summary.skipped !== undefined && summary.skipped > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffb400', background: 'rgba(255,180,0,0.1)', padding: '10px 16px', borderRadius: '8px' }}>
                    <AlertTriangle size={20} />
                    <span style={{ fontWeight: '600' }}>{summary.skipped} Skipped</span>
                  </div>
                )}
                {summary.error !== undefined && summary.error > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ff4b4b', background: 'rgba(255,75,75,0.1)', padding: '10px 16px', borderRadius: '8px' }}>
                    <AlertTriangle size={20} />
                    <span style={{ fontWeight: '600' }}>{summary.error} Errors</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {parsedData.length > 0 && (
            <div>
              <h4 style={{ fontWeight: '600', marginBottom: '12px' }}>Preview (First 10 Rows)</h4>
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      {Object.keys(parsedData[0]).map((key, i) => (
                        <th key={i}>{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.slice(0, 10).map((row, i) => (
                      <tr key={i}>
                        {Object.values(row).map((val, j) => (
                          <td key={j}>{val}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkUpload;
