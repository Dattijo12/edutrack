import api from './api';

const adminService = {
  // Staff Users
  async getUsers(role = 'all', search = '') {
    const res = await api.get('/admin/users', { params: { role, search } });
    return res.data;
  },

  async createUser(data) {
    const res = await api.post('/admin/users', data);
    return res.data;
  },

  async updateUser(id, data) {
    const res = await api.put(`/admin/users/${id}`, data);
    return res.data;
  },

  async deleteUser(id) {
    const res = await api.delete(`/admin/users/${id}`);
    return res.data;
  },

  // School Settings
  async getSettings() {
    const res = await api.get('/admin/settings');
    return res.data;
  },

  async updateSettings(data) {
    const res = await api.put('/admin/settings', data);
    return res.data;
  },

  // Subject Assignments
  async getSubjectAssignments() {
    const res = await api.get('/admin/subject-assignments');
    return res.data;
  },

  async assignSubject(data) {
    const res = await api.post('/admin/subject-assignments', data);
    return res.data;
  },

  async deleteAssignment(id) {
    const res = await api.delete(`/admin/subject-assignments/${id}`);
    return res.data;
  },

  // 1-Click Class Promotion
  async promoteClass(data) {
    const res = await api.post('/admin/promote-class', data);
    return res.data;
  }
};

export default adminService;
