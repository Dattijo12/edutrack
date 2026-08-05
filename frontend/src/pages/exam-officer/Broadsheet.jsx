import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  const [error, setError] = useState('');

  useEffect(() => {
    classService.getAll().then(setClasses).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedClass) {
      studentService.getByClass(selectedClass).then(setStudentsInClass).catch(console.error);
    } else {
      setStudentsInClass([]);
    }
  }, [selectedClass]);

  const handleGenerateBroadsheet = async () => {
    if (!selectedClass) return;
    setLoading(true);
    setError('');
    setReportCardData(null);
    try {
      const data = await examOfficerService.getBroadsheet(selectedClass);
      setBroadsheetData(data);
    } catch (err) {
      console.error(err);
      setError('Failed to generate class broadsheet.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReportCard = async () => {
    if (!selectedStudentId) return;
    setLoading(true);
    setError('');
    setBroadsheetData(null);
    try {
      const data = await examOfficerService.getReportCard(selectedStudentId);
      setReportCardData(data);
    } catch (err) {
      console.error(err);
      if (err?.response?.data?.locked) {
        setReportCardData({ locked: true, message: err.response.data.message, student: err.response.data.student });
      } else {
        setError('Failed to generate report card.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1400px', margin: '0 auto' }} className="animate-fade-in">
      
      {/* Control Panel (Hidden on Print) */}
      <div className="glass-panel no-print" style={{ padding: '35px', marginBottom: '30px' }}>
        <Link to="/dashboard" style={{ color: '#00f2fe', textDecoration: 'none', fontSize: '14px', marginBottom: '15px', display: 'inline-block' }}>
          &larr; Back to Dashboard
        </Link>
        <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>1-Click Broadsheets & Student Report Cards</h2>
        <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '14px', marginBottom: '25px' }}>
          Generate print-ready A4 Broadsheets or individual Report Cards featuring WAEC/NECO grades, fee clearance gatekeeper, and QR code verification.
        </p>

        {/* View Mode Switcher */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
          <button 
            onClick={() => setViewMode('broadsheet')} 
            className={viewMode === 'broadsheet' ? 'btn-primary' : 'btn-secondary'}
          >
            📊 Class Broadsheet Grid (A4 Landscape)
          </button>
          <button 
            onClick={() => setViewMode('report_card')} 
            className={viewMode === 'report_card' ? 'btn-primary' : 'btn-secondary'}
          >
            📜 Individual Report Card
          </button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center', background: 'rgba(0,0,0,0.15)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-dark)' }}>
          <select className="glass-input" style={{ maxWidth: '250px' }} value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
            <option value="" style={{ color: '#000' }}>Select Class</option>
            {classes.map(c => (
              <option key={c.id} value={c.id} style={{ color: '#000' }}>{c.name} {c.arm}</option>
            ))}
          </select>

          {viewMode === 'report_card' && (
            <select className="glass-input" style={{ maxWidth: '280px' }} value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} disabled={!selectedClass}>
              <option value="" style={{ color: '#000' }}>Select Student</option>
              {studentsInClass.map(s => (
                <option key={s.id} value={s.id} style={{ color: '#000' }}>{s.first_name ? `${s.first_name} ${s.last_name}` : s.name} ({s.admission_number})</option>
              ))}
            </select>
          )}

          {viewMode === 'broadsheet' ? (
            <button onClick={handleGenerateBroadsheet} className="btn-primary" disabled={!selectedClass || loading}>
              {loading ? 'Generating...' : '⚡ Generate Broadsheet'}
            </button>
          ) : (
            <button onClick={handleGenerateReportCard} className="btn-primary" disabled={!selectedStudentId || loading}>
              {loading ? 'Generating...' : '⚡ Generate Report Card'}
            </button>
          )}

          {(broadsheetData || reportCardData) && (
            <button onClick={handlePrint} className="btn-secondary" style={{ marginLeft: 'auto' }}>
              🖨️ Print / Export PDF
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="no-print" style={{ padding: '14px', borderRadius: '8px', background: 'rgba(255,75,75,0.15)', color: '#ff4b4b', marginBottom: '20px' }}>
          ❌ {error}
        </div>
      )}

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
                          {score ? `${score.ca} | ${score.exam} | ${score.total}` : '-'}
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
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#ff4b4b', marginBottom: '10px' }}>
              🔒 REPORT CARD LOCKED (FEE GATEKEEPER)
            </h2>
            <p style={{ fontSize: '15px', color: 'hsl(var(--text-primary))', maxWidth: '600px', margin: '0 auto 20px auto' }}>
              {reportCardData.message}
            </p>
            <div style={{ display: 'inline-block', padding: '12px 20px', borderRadius: '8px', background: 'rgba(0,0,0,0.2)', fontSize: '14px' }}>
              Student: <strong>{reportCardData.student?.name}</strong> ({reportCardData.student?.class})
            </div>
          </div>
        ) : (
          <div className="printable-area animate-fade-in" style={{ background: '#fff', color: '#000', padding: '40px', borderRadius: '12px', border: '2px solid #000' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #000', paddingBottom: '20px', marginBottom: '20px' }}>
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: '800', textTransform: 'uppercase', margin: 0 }}>{reportCardData.school?.name}</h1>
                <p style={{ fontSize: '12px', margin: '2px 0' }}>{reportCardData.school?.address}</p>
                <p style={{ fontSize: '12px', margin: 0 }}>Phone: {reportCardData.school?.phone} | Email: {reportCardData.school?.email}</p>
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
              <div><strong>Gender:</strong> {reportCardData.student?.gender}</div>
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
                <div style={{ border: '2px solid #000', padding: '6px', background: '#f5f5f5', borderRadius: '4px', textAlign: 'center', width: '80px', height: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '28px' }}>🏁</span>
                  <span style={{ fontSize: '8px', fontWeight: 'bold', marginTop: '2px' }}>QR VERIFIED</span>
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

    </div>
  );
};

export default Broadsheet;
