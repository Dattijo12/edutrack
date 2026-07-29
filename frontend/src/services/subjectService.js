import api from './api';

const subjectService = {
  /**
   * Fetch all subjects.
   */
  async getAll() {
    const response = await api.get('/admin/subjects');
    return response.data;
  },

  /**
   * Fetch a single subject.
   */
  async get(id) {
    const response = await api.get(`/admin/subjects/${id}`);
    return response.data;
  },

  /**
   * Create a new subject.
   */
  async create(data) {
    const response = await api.post('/admin/subjects', data);
    return response.data;
  },

  /**
   * Update a subject.
   */
  async update(id, data) {
    const response = await api.put(`/admin/subjects/${id}`, data);
    return response.data;
  },

  /**
   * Delete a subject.
   */
  async delete(id) {
    const response = await api.delete(`/admin/subjects/${id}`);
    return response.data;
  }
};

export default subjectService;
