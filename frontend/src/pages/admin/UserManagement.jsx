import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import adminService from '../../services/adminService';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'teacher',
    password: '',
    status: 'active'
  });

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, search]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await adminService.getUsers(roleFilter, search);
      setUsers(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch user accounts.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        password: '',
        status: user.status || 'active'
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        role: 'teacher',
        password: '',
        status: 'active'
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      if (editingUser) {
        await adminService.updateUser(editingUser.id, formData);
        setMessage('✅ User account updated successfully.');
      } else {
        await adminService.createUser(formData);
        setMessage('✅ Staff account created successfully!');
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || 'Error saving user account.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this staff account?')) return;
    try {
      await adminService.deleteUser(id);
      setMessage('User account deleted.');
      fetchUsers();
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || 'Failed to delete account.');
    }
  };

  return (
    <div style={{ padding: '30px', maxWidth: '1200px', margin: '0 auto' }} className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '40px' }}>
        <div style={{ marginBottom: '30px', borderBottom: '1px solid var(--border-dark)', paddingBottom: '20px' }}>
          <Link to="/dashboard" style={{ color: '#00f2fe', textDecoration: 'none', fontSize: '14px', marginBottom: '10px', display: 'inline-block' }}>
            &larr; Back to Dashboard
          </Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
            <div>
              <h2 style={{ fontSize: '28px', fontWeight: '700' }}>Staff Account Management</h2>
              <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '14px', marginTop: '4px' }}>
                Create and manage credentials for Subject Teachers, Exam Officers, Bursars, and Form Masters.
              </p>
            </div>
            <button onClick={() => handleOpenModal()} className="btn-primary">
              + Create Staff Account
            </button>
          </div>
        </div>

        {message && (
          <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(75,255,125,0.15)', color: '#4bff7d', fontSize: '14px', marginBottom: '20px' }}>
            {message}
          </div>
        )}

        {error && (
          <div style={{ padding: '12px 16px', borderRadius: '8px', background: 'rgba(255,75,75,0.15)', color: '#ff4b4b', fontSize: '14px', marginBottom: '20px' }}>
            ❌ {error}
          </div>
        )}

        {/* Filter and Search Bar */}
        <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="Search by name, email or phone..." 
            className="glass-input" 
            style={{ maxWidth: '350px' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select 
            className="glass-input" 
            style={{ maxWidth: '200px' }}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all" style={{ color: '#000' }}>All Roles</option>
            <option value="teacher" style={{ color: '#000' }}>Subject Teachers</option>
            <option value="form_master" style={{ color: '#000' }}>Form Masters</option>
            <option value="exam_officer" style={{ color: '#000' }}>Exam Officers</option>
            <option value="bursar" style={{ color: '#000' }}>Bursars</option>
            <option value="admin" style={{ color: '#000' }}>Administrators</option>
          </select>
        </div>

        {/* Users Table */}
        {loading ? (
          <p style={{ textAlign: 'center', color: 'hsl(var(--text-secondary))', padding: '40px' }}>Loading staff records...</p>
        ) : users.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', background: 'rgba(0,0,0,0.15)', borderRadius: '12px', border: '1px dashed var(--border-dark)' }}>
            <p style={{ color: 'hsl(var(--text-secondary))' }}>No staff accounts found.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-dark)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ background: 'var(--table-header-bg)', borderBottom: '1px solid var(--border-dark)' }}>
                <tr>
                  <th style={{ padding: '14px 18px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>Staff Name</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>Email</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>Phone</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>Assigned Role</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '14px 18px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border-dark)' }}>
                    <td style={{ padding: '14px 18px', fontWeight: '600' }}>{u.name}</td>
                    <td style={{ padding: '14px 18px', fontSize: '13px', color: 'hsl(var(--text-secondary))' }}>{u.email}</td>
                    <td style={{ padding: '14px 18px', fontSize: '13px', color: 'hsl(var(--text-secondary))' }}>{u.phone || 'N/A'}</td>
                    <td style={{ padding: '14px 18px' }}>
                      <span className={`badge badge-${u.role}`}>{u.role.replace('_', ' ')}</span>
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <span style={{ fontSize: '12px', color: u.status === 'active' ? '#4bff7d' : '#ff4b4b', fontWeight: '600' }}>
                        ● {u.status || 'active'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                      <button onClick={() => handleOpenModal(u)} style={{ background: 'none', border: 'none', color: '#00f2fe', cursor: 'pointer', marginRight: '12px', fontWeight: '600' }}>
                        Edit
                      </button>
                      <button onClick={() => handleDelete(u.id)} style={{ background: 'none', border: 'none', color: '#ff4b4b', cursor: 'pointer', fontWeight: '600' }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Create / Edit User Modal */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '500px', padding: '35px', background: 'hsl(var(--card-dark))' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '20px' }}>
              {editingUser ? 'Edit Staff Account' : 'Create New Staff Account'}
            </h3>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>Full Name</label>
                <input type="text" className="glass-input" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>Email Address</label>
                <input type="email" className="glass-input" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>Phone Number</label>
                <input type="text" className="glass-input" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="+234..." />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>Assigned Role</label>
                <select className="glass-input" value={formData.role} onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                  <option value="teacher" style={{ color: '#000' }}>Subject Teacher</option>
                  <option value="form_master" style={{ color: '#000' }}>Form Master</option>
                  <option value="exam_officer" style={{ color: '#000' }}>Exam Officer</option>
                  <option value="bursar" style={{ color: '#000' }}>Bursar (Financials)</option>
                  <option value="admin" style={{ color: '#000' }}>Super Admin</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>
                  {editingUser ? 'New Password (Leave blank to keep existing)' : 'Initial Password'}
                </label>
                <input type="password" className="glass-input" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!editingUser} minLength={6} placeholder="••••••••" />
              </div>

              {editingUser && (
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', color: 'hsl(var(--text-secondary))', textTransform: 'uppercase' }}>Account Status</label>
                  <select className="glass-input" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                    <option value="active" style={{ color: '#000' }}>Active</option>
                    <option value="inactive" style={{ color: '#000' }}>Inactive (Disabled)</option>
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '15px' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Save Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserManagement;
