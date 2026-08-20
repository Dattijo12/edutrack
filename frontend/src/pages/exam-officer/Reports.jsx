import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, BarChart3, Printer, FileSpreadsheet } from 'lucide-react';
import examOfficerService from '../../services/examOfficerService';
import classService from '../../services/classService';

import { useSchool } from '../../context/SchoolContext';

const Reports = () => {
  const { school } = useSchool();
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
      toast.success('Class report generated successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate class report.');
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
      <div className="glass-panel no-print" style={{ padding: '40px' }}>
        
        <div style={{ marginBottom: '30px', borderBottom: '1px solid var(--border-dark)', paddingBottom: '20px' }}>
          <Link to="/dashboard" className="back-link">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(0, 242, 254, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart3 size={22} color="#00f2fe" />
            </div>
            <div>
              <h2 style={{ fontSize: '28px', fontWeight: '700' }}>Academic Class Reports</h2>
              <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '14px', marginTop: '2px' }}>
                Generate official terminal report sheets and class grade broadsheets.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select 
            className="glass-input"
            style={{ maxWidth: '320px' }}
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
          >
            {loading ? (
              <><span className="spinner spinner-sm"></span> Generating...</>
            ) : (
              <><FileSpreadsheet size={16} /> Generate Report</>
            )}
          </button>
          
          {reportData && (
            <button 
              onClick={printReport}
              className="btn-secondary"
              style={{ marginLeft: 'auto' }}
            >
              <Printer size={16} /> Print / Export PDF
            </button>
          )}
        </div>
      </div>

      {/* Printable Report Area */}
      {reportData && (
        <div style={{ marginTop: '30px', background: '#fff', color: '#000', padding: '40px', borderRadius: '12px' }} id="printable-report" className="printable-area">
          
          <div style={{ textAlign: 'center', marginBottom: '32px', borderBottom: '2px solid #333', paddingBottom: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {school?.logo_url && (
              <img 
                src={school.logo_url} 
                alt={school.name} 
                style={{ maxHeight: '70px', objectFit: 'contain', marginBottom: '12px' }} 
              />
            )}
            <h1 style={{ fontSize: '28px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '2px', margin: '0' }}>
              {school?.name || 'EduTrack Academy'}
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#555' }}>
              {school?.address} {school?.phone ? `| Tel: ${school.phone}` : ''}
            </p>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginTop: '12px', color: '#444' }}>Official Class Master Sheet</h3>
            <p style={{ marginTop: '4px', color: '#666', fontSize: '14px' }}>Class: <span style={{ fontWeight: 'bold', color: '#000' }}>{reportData.class}</span></p>
          </div>

          {Object.keys(reportData.report).length === 0 ? (
            <p style={{ textAlign: 'center', color: '#888', margin: '40px 0' }}>No result records found for this class.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {Object.entries(reportData.report).map(([studentId, results]) => (
                <div key={studentId} style={{ pageBreakInside: 'avoid', border: '1px solid #ddd', padding: '20px', borderRadius: '8px' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '12px', background: '#f5f5f5', padding: '10px 14px', borderLeft: '4px solid #4a5cff', borderRadius: '4px' }}>
                    Student Record: #{studentId}
                  </h4>
                  
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                    <thead style={{ borderBottom: '2px solid #ddd', background: '#fafafa' }}>
                      <tr>
                        <th style={{ padding: '8px 12px' }}>Subject</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>CA</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>Exam</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>Total</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center' }}>Grade</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((res, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '8px 12px', fontWeight: '500' }}>{res.subject}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>{res.ca_score}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>{res.exam_score}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: '700' }}>{res.total}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: '700', color: '#4a5cff' }}>{res.grade}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right' }}>
                            <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: res.status === 'approved' ? '#e6ffed' : '#fff3cd', color: res.status === 'approved' ? '#22863a' : '#856404', textTransform: 'uppercase', fontWeight: '700' }}>
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
