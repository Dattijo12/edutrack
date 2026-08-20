import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { 
  UserPlus, Pencil, Trash2, Users, Save, Search, Filter, X, 
  Shield, Phone, Mail, BookOpen, Layers, CheckSquare
} from 'lucide-react';
import adminService from '../../services/adminService';
import classService from '../../services/classService';
import subjectService from '../../services/subjectService';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [classList, setClassList] = useState([]);
  const [subjectList, setSubjectList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'teacher',
    password: '',
    status: 'active',
    assigned_class_id: '',
    assigned_subject_ids: []
  });

  useEffect(() => {
    fetchUsers();
    fetchAuxiliaryData();
  }, [roleFilter, search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await adminService.getUsers(roleFilter, search);
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
      toast.error('Failed to fetch staff accounts.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuxiliaryData = async () => {
    try {
      const [classes, subjects] = await Promise.all([
        classService.getAll(),
        subjectService.getAll()
      ]);
      setClassList(classes);
      setSubjectList(subjects);
    } catch (err) {
      console.error('Failed to load auxiliary data:', err);
    }
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      
      // Extract existing assigned subject IDs and class ID
      const assignedSubIds = user.subject_assignments 
        ? user.subject_assignments.map(a => a.subject_id) 
        : [];
      
      const assignedClassId = user.assigned_classes && user.assigned_classes.length > 0 
        ? user.assigned_classes[0].id 
        : (user.subject_assignments && user.subject_assignments.length > 0 ? user.subject_assignments[0].class_id : '');

      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        password: '',
        status: user.status || 'active',
        assigned_class_id: assignedClassId || '',
        assigned_subject_ids: assignedSubIds
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'teacher',
        password: '',
        status: 'active',
        assigned_class_id: classList.length > 0 ? classList[0].id : '',
        assigned_subject_ids: []
      });
    }
    setShowModal(true);
  };

  const handleSubjectToggle = (subjectId) => {
    setFormData(prev => {
      const exists = prev.assigned_subject_ids.includes(subjectId);
      if (exists) {
        return { ...prev, assigned_subject_ids: prev.assigned_subject_ids.filter(id => id !== subjectId) };
      } else {
        return { ...prev, assigned_subject_ids: [...prev.assigned_subject_ids, subjectId] };
      }
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingUser) {
        await adminService.updateUser(editingUser.id, formData);
        toast.success(`Staff account for "${formData.name}" updated successfully!`);
      } else {
        await adminService.createUser(formData);
        toast.success(`Staff account created for "${formData.name}"!`);
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      console.error('Save user error:', err);
      toast.error(err?.response?.data?.message || 'Error saving staff account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, userName) => {
    if (!window.confirm(`Are you sure you want to delete staff account for "${userName}"?`)) return;
    setDeletingId(id);

    try {
      await adminService.deleteUser(id);
      toast.success(`Staff account "${userName}" deleted.`);
      fetchUsers();
    } catch (err) {
      console.error('Delete user error:', err);
      toast.error(err?.response?.data?.message || 'Failed to delete account.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }} className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '36px' }}>
        
        {/* Module Header */}
        <div style={{ marginBottom: '28px', borderBottom: '1px solid var(--border-dark)', paddingBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(92, 124, 250, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={22} color="#7b93ff" />
              </div>
              <div>
                <h2 style={{ fontSize: '26px', fontWeight: '800' }}>Staff Account & Subject Management</h2>
                <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '14px', marginTop: '2px' }}>
                  Create and manage staff accounts, roles, assigned class arms, and teaching subject allocations.
                </p>
              </div>
            </div>
            <button onClick={() => handleOpenModal()} className="btn-primary">
              <UserPlus size={18} /> Create Staff Account
            </button>
          </div>
        </div>

        {/* Search & Role Filter Toolbar */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: '380px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-secondary))' }} />
            <input 
              type="text" 
              placeholder="Search staff by name, email or phone..." 
              className="glass-input" 
              style={{ paddingLeft: '38px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ position: 'relative', minWidth: '220px' }}>
            <Filter size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-secondary))' }} />
            <select 
              className="glass-input" 
              style={{ paddingLeft: '38px' }}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all" style={{ color: '#000' }}>All Staff Roles</option>
              <option value="teacher" style={{ color: '#000' }}>Subject Teachers</option>
              <option value="form_master" style={{ color: '#000' }}>Form Masters</option>
              <option value="exam_officer" style={{ color: '#000' }}>Exam Officers</option>
              <option value="bursar" style={{ color: '#000' }}>Bursars</option>
              <option value="admin" style={{ color: '#000' }}>Administrators</option>
            </select>
          </div>
        </div>

        {/* Staff Table View */}
        {loading ? (
          <div className="page-loading">
            <span className="spinner"></span>
            <p>Loading staff directory & assignments...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <Users size={44} style={{ opacity: 0.3, marginBottom: '8px' }} />
            <p>No staff accounts found matching your filter criteria.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-dark)' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Staff Name</th>
                  <th>Contact Info</th>
                  <th>Role</th>
                  <th>Assigned Class / Subjects</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => {
                  const assignedSubs = u.subject_assignments || [];
                  const formClasses = u.assigned_classes || [];

                  return (
                    <tr key={u.id}>
                      <td style={{ fontWeight: '700' }}>{u.name}</td>
                      <td>
                        <div style={{ fontSize: '13px', fontWeight: '500' }}>{u.email}</div>
                        <div style={{ fontSize: '12px', color: 'hsl(var(--text-secondary))' }}>{u.phone || 'No phone'}</div>
                      </td>
                      <td>
                        <span className={`badge badge-${u.role}`}>{u.role.replace('_', ' ')}</span>
                      </td>
                      <td>
                        {/* Render Assigned Class / Form Master info */}
                        {formClasses.length > 0 && (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(0, 230, 118, 0.12)', color: '#00e676', border: '1px solid rgba(0, 230, 118, 0.25)', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '700', marginRight: '6px', marginBottom: '4px' }}>
                            <Layers size={12} /> Form Master: {formClasses[0].name} {formClasses[0].arm}
                          </div>
                        )}

                        {/* Render Subject Assignments */}
                        {assignedSubs.length > 0 ? (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {assignedSubs.map((sub, idx) => (
                              <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(123, 147, 255, 0.12)', color: '#7b93ff', border: '1px solid rgba(123, 147, 255, 0.25)', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600' }}>
                                <BookOpen size={10} />
                                {sub.subject?.name || 'Subject'} ({sub.school_class?.name || 'Class'} {sub.school_class?.arm})
                              </span>
                            ))}
                          </div>
                        ) : (
                          formClasses.length === 0 && (
                            <span style={{ fontSize: '12px', color: 'hsl(var(--text-secondary))', italic: 'true' }}>None Assigned</span>
                          )
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: '12px', color: u.status === 'active' ? '#4bff7d' : '#ff4b4b', fontWeight: '700' }}>
                          ● {u.status || 'active'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button onClick={() => handleOpenModal(u)} className="btn-edit">
                            <Pencil size={14} /> Edit
                          </button>
                          <button onClick={() => handleDelete(u.id, u.name)} className="btn-delete" disabled={deletingId === u.id}>
                            {deletingId === u.id ? <span className="spinner spinner-sm"></span> : <Trash2 size={14} />} Delete
                          </button>
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

      {/* Staff Account & Subject Assignment Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content animate-slide-up" style={{ maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-dark)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '800' }}>
                {editingUser ? 'Edit Staff Account & Allocations' : 'Create Staff Account & Allocations'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'hsl(var(--text-secondary))', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Full Name</label>
                  <input 
                    type="text" 
                    className="glass-input" 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    placeholder="e.g. Samuel Okon" 
                    required 
                  />
                </div>

                <div>
                  <label className="form-label">Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-secondary))' }} />
                    <input 
                      type="email" 
                      className="glass-input" 
                      style={{ paddingLeft: '36px' }} 
                      value={formData.email} 
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                      placeholder="teacher@school.com" 
                      required 
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">Phone Number</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-secondary))' }} />
                    <input 
                      type="text" 
                      className="glass-input" 
                      style={{ paddingLeft: '36px' }} 
                      value={formData.phone} 
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                      placeholder="+234..." 
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Assigned System Role</label>
                  <div style={{ position: 'relative' }}>
                    <Shield size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-secondary))' }} />
                    <select 
                      className="glass-input" 
                      style={{ paddingLeft: '36px' }} 
                      value={formData.role} 
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    >
                      <option value="teacher" style={{ color: '#000' }}>Subject Teacher</option>
                      <option value="form_master" style={{ color: '#000' }}>Form Master</option>
                      <option value="exam_officer" style={{ color: '#000' }}>Exam Officer</option>
                      <option value="bursar" style={{ color: '#000' }}>Bursar (Financials)</option>
                      <option value="admin" style={{ color: '#000' }}>Super Admin</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Dynamic Teacher / Form Master Class & Subject Assignment Fields */}
              {(formData.role === 'teacher' || formData.role === 'form_master') && (
                <div style={{ padding: '18px', borderRadius: '12px', background: 'rgba(92, 124, 250, 0.08)', border: '1px solid rgba(92, 124, 250, 0.2)' }}>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                    <BookOpen size={18} color="#7b93ff" />
                    <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#7b93ff' }}>
                      Teacher Class & Subject Allocation
                    </h4>
                  </div>

                  {/* Class Selection Dropdown */}
                  <div style={{ marginBottom: '16px' }}>
                    <label className="form-label">Assigned Class / Arm</label>
                    <select
                      className="glass-input"
                      value={formData.assigned_class_id}
                      onChange={(e) => setFormData({ ...formData, assigned_class_id: e.target.value })}
                    >
                      <option value="" style={{ color: '#000' }}>-- Select Class Arm --</option>
                      {classList.map(c => (
                        <option key={c.id} value={c.id} style={{ color: '#000' }}>
                          {c.name} (Arm {c.arm})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Multi-Select Subject Selector */}
                  <div>
                    <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>
                      Assigned Teaching Subject(s)
                    </label>

                    {subjectList.length === 0 ? (
                      <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))' }}>
                        No subjects created in curriculum yet. Add subjects in Subject Curriculum first.
                      </p>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '10px', maxHeight: '160px', overflowY: 'auto', padding: '10px', borderRadius: '10px', background: 'rgba(0,0,0,0.15)', border: '1px solid var(--border-dark)' }}>
                        {subjectList.map(s => {
                          const checked = formData.assigned_subject_ids.includes(s.id);
                          return (
                            <label 
                              key={s.id} 
                              style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '8px', 
                                cursor: 'pointer',
                                fontSize: '13px',
                                fontWeight: '600',
                                padding: '6px 10px',
                                borderRadius: '8px',
                                background: checked ? 'rgba(92, 124, 250, 0.2)' : 'transparent',
                                border: checked ? '1px solid rgba(92, 124, 250, 0.4)' : '1px solid transparent',
                                color: checked ? '#7b93ff' : 'hsl(var(--text-primary))'
                              }}
                            >
                              <input 
                                type="checkbox"
                                checked={checked}
                                onChange={() => handleSubjectToggle(s.id)}
                                style={{ accentColor: '#7b93ff', cursor: 'pointer' }}
                              />
                              <span>{s.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>

                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: editingUser ? '1fr 1fr' : '1fr', gap: '16px' }}>
                <div>
                  <label className="form-label">
                    {editingUser ? 'New Password (Leave blank to keep current)' : 'Initial Password'}
                  </label>
                  <input 
                    type="password" 
                    className="glass-input" 
                    value={formData.password} 
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                    required={!editingUser} 
                    minLength={6} 
                    placeholder="••••••••" 
                  />
                </div>

                {editingUser && (
                  <div>
                    <label className="form-label">Account Status</label>
                    <select className="glass-input" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                      <option value="active" style={{ color: '#000' }}>Active</option>
                      <option value="inactive" style={{ color: '#000' }}>Inactive (Disabled)</option>
                    </select>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-cancel">Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? (
                    <><span className="spinner spinner-sm"></span> Saving...</>
                  ) : (
                    <><Save size={16} /> Save Staff Account</>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserManagement;
