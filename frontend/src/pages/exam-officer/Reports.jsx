import React, { useEffect, useState } from 'react';
import examOfficerService from '../../services/examOfficerService';
import classService from '../../services/classService';
import { Link } from 'react-router-dom';

const Reports = () => {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    classService.getAll().then(setClasses).catch(console.error);
  }, []);

  const handleGenerateReport = async () => {
    if (!selectedClass) return;
    setLoading(true);
    try {
      const data = await examOfficerService.getClassReport(selectedClass);
      setReportData(data);
    } catch (error) {
      console.error(error);
      alert('Failed to generate report.');
    } finally {
      setLoading(false);
    }
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }} className="animate-fade-in">
      
      {/* Non-printable header area */}
      <div className="glass-panel" style={{ padding: '40px' }} id="report-controls">
        <Link to="/dashboard" style={{ color: '#00f2fe', textDecoration: 'none', fontSize: '14px', marginBottom: '10px', display: 'inline-block' }}>&larr; Back to Dashboard</Link>
        <h2 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '20px' }}>Academic Class Reports</h2>
        
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <select 
            className="glass-input"
            style={{ maxWidth: '300px' }}
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="" style={{ color: '#000' }}>Select a Class to Generate Report</option>
            {classes.map(c => (
              <option key={c.id} value={c.id} style={{ color: '#000' }}>{c.name}</option>
            ))}
          </select>
          <button 
            onClick={handleGenerateReport}
            className="btn-primary"
            disabled={!selectedClass || loading}
            style={{ opacity: (!selectedClass || loading) ? 0.5 : 1, cursor: (!selectedClass || loading) ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
          
          {reportData && (
            <button 
              onClick={printReport}
              style={{ marginLeft: 'auto', padding: '12px 24px', background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
            >
              Print / Save PDF
            </button>
          )}
        </div>
      </div>

      {/* Printable Report Area */}
      {reportData && (
        <div style={{ marginTop: '40px', background: '#fff', color: '#000', padding: '40px', borderRadius: '8px' }} id="printable-report">
          <style>
            {`
              @media print {
                body * { visibility: hidden; }
                #printable-report, #printable-report * { visibility: visible; }
                #printable-report { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 0; }
                .glass-panel { background: transparent !important; box-shadow: none !important; border: none !important; }
              }
            `}
          </style>
          
          <div style={{ textAlign: 'center', marginBottom: '40px', borderBottom: '2px solid #333', paddingBottom: '20px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '2px', margin: '0' }}>EduTrack Academy</h1>
            <h3 style={{ fontSize: '20px', fontWeight: '600', marginTop: '10px', color: '#444' }}>Official Class Master Sheet</h3>
            <p style={{ marginTop: '8px', color: '#666', fontFamily: 'monospace' }}>Class: <span style={{ fontWeight: 'bold', color: '#000' }}>{reportData.class}</span></p>
          </div>

          {Object.keys(reportData.report).length === 0 ? (
            <p style={{ textAlign: 'center', color: '#888', margin: '40px 0' }}>No results found for this class.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              {Object.entries(reportData.report).map(([studentId, results]) => (
                <div key={studentId} style={{ pageBreakInside: 'avoid', border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
                  <h4 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '15px', background: '#f5f5f5', padding: '10px', borderLeft: '4px solid #4a5cff' }}>
                    Student Reference: #{studentId}
                  </h4>
                  
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                    <thead style={{ borderBottom: '2px solid #ddd' }}>
                      <tr>
                        <th style={{ padding: '8px 0' }}>Subject</th>
                        <th style={{ padding: '8px 0', textAlign: 'center' }}>CA</th>
                        <th style={{ padding: '8px 0', textAlign: 'center' }}>Exam</th>
                        <th style={{ padding: '8px 0', textAlign: 'center' }}>Total</th>
                        <th style={{ padding: '8px 0', textAlign: 'center' }}>Grade</th>
                        <th style={{ padding: '8px 0', textAlign: 'right' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((res, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '8px 0', fontWeight: '500' }}>{res.subject}</td>
                          <td style={{ padding: '8px 0', textAlign: 'center' }}>{res.ca_score}</td>
                          <td style={{ padding: '8px 0', textAlign: 'center' }}>{res.exam_score}</td>
                          <td style={{ padding: '8px 0', textAlign: 'center', fontWeight: '700' }}>{res.total}</td>
                          <td style={{ padding: '8px 0', textAlign: 'center', fontWeight: '700', color: '#4a5cff' }}>{res.grade}</td>
                          <td style={{ padding: '8px 0', textAlign: 'right' }}>
                            <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', background: res.status === 'approved' ? '#e6ffed' : '#fff3cd', color: res.status === 'approved' ? '#22863a' : '#856404', textTransform: 'uppercase' }}>
                              {res.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
