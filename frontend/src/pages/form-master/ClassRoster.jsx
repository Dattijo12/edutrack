import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Users, Search, User, Layers } from 'lucide-react';
import formMasterService from '../../services/formMasterService';
import studentService from '../../services/studentService';
import { useAuth } from '../../context/AuthContext';

const ClassRoster = () => {
  const { user } = useAuth();
  const [assignedClass, setAssignedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRoster();
  }, []);

  const fetchRoster = async () => {
    setLoading(true);
    try {
      if (user?.role === 'form_master') {
        // Fetch assigned class details for authenticated Form Master session
        const classData = await formMasterService.getAssignedClass();
        setAssignedClass(classData);
        if (classData && classData.id) {
          try {
            const studentList = await studentService.getByClass(classData.id);
            const fetchedArray = Array.isArray(studentList) ? studentList : (studentList?.data || []);
            setStudents(fetchedArray.length > 0 ? fetchedArray : (classData.students || []));
          } catch (fetchErr) {
            console.warn('Class student fetch fallback to assigned class structure:', fetchErr);
            setStudents(classData.students || []);
          }
        } else {
          setStudents(classData?.students || []);
        }
      } else {
        // Fetch all students for administrative roles
        const allStudents = await studentService.getAllStudents();
        setStudents(Array.isArray(allStudents) ? allStudents : (allStudents?.data || []));
      }
    } catch (err) {
      console.error('Roster error:', err);
      toast.error('Failed to load assigned class roster.');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(s => 
    (s.name || `${s.first_name || ''} ${s.last_name || ''}`)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.admission_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }} className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '32px' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-dark)', paddingBottom: '16px' }}>
          <Link to="/dashboard" className="back-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'hsl(var(--text-secondary))', textDecoration: 'none', marginBottom: '12px' }}>
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(123, 147, 255, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={22} color="#7b93ff" />
              </div>
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: '800' }}>
                  Assigned Class Roster {assignedClass ? `— ${assignedClass.name} ${assignedClass.arm}` : ''}
                </h2>
                <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '14px' }}>
                  Student profiles and enrollment roster for your assigned form class.
                </p>
              </div>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-secondary))' }} />
              <input 
                type="text" 
                placeholder="Search student or admission #" 
                className="glass-input"
                style={{ paddingLeft: '36px', height: '40px', fontSize: '13px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="page-loading">
            <span className="spinner"></span>
            <p>Loading assigned class roster...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px', textAlign: 'center' }}>
            <User size={48} color="#7b93ff" style={{ opacity: 0.5, marginBottom: '12px' }} />
            <p style={{ fontSize: '16px', fontWeight: '600' }}>No students found</p>
            <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '13px' }}>
              {assignedClass ? 'No registered students found in your assigned class.' : 'There are no registered students matching your search criteria.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-dark)' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Admission #</th>
                  <th>Full Name</th>
                  <th>Gender</th>
                  <th>Class</th>
                  <th>Date of Birth</th>
                  <th>Parent Phone</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td style={{ fontWeight: '700', color: '#7b93ff' }}>{student.admission_number}</td>
                    <td style={{ fontWeight: '600' }}>{student.name || `${student.first_name || ''} ${student.last_name || ''}`}</td>
                    <td>{student.gender || 'N/A'}</td>
                    <td>{student.class ? `${student.class.name} ${student.class.arm || ''}` : (assignedClass ? `${assignedClass.name} ${assignedClass.arm}` : 'Assigned Class')}</td>
                    <td>{student.dob || 'N/A'}</td>
                    <td>{student.parent_phone || 'N/A'}</td>
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

export default ClassRoster;
