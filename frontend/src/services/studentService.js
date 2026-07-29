import api from './api';

const studentService = {
  /**
   * Fetch all students.
   */
  async getAll() {
    const response = await api.get('/admin/students');
    return response.data;
  },

  /**
   * Fetch a single student.
   */
  async get(id) {
    const response = await api.get(`/admin/students/${id}`);
    return response.data;
  },

  /**
   * Register a new student.
   */
  async create(data) {
    const response = await api.post('/admin/students', data);
    return response.data;
  },

  /**
   * Update student profile.
   */
  async update(id, data) {
    const response = await api.put(`/admin/students/${id}`, data);
    return response.data;
  },

  /**
   * Delete a student.
   */
  async delete(id) {
    const response = await api.delete(`/admin/students/${id}`);
    return response.data;
  }
};

export default studentService;
