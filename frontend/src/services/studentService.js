import api from './api';

const studentService = {
  /**
   * Fetch all students with optional search and class filter.
   */
  async getAll(search = '', classId = '') {
    const params = {};
    if (search) params.search = search;
    if (classId) params.class_id = classId;
    const response = await api.get('/admin/students', { params });
    return response.data;
  },

  /**
   * Alias for getAll to maintain interface compatibility across pages.
   */
  async getAllStudents(search = '', classId = '') {
    return this.getAll(search, classId);
  },

  /**
   * Fetch list of enrolled students for a specific class ID.
   * @param {number|string} classId
   */
  async getByClass(classId) {
    const response = await api.get('/teacher/students', { params: { class_id: classId } });
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
