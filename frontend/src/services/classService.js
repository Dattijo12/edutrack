import api from './api';

const classService = {
  /**
   * Fetch all classes.
   */
  async getAll() {
    const response = await api.get('/admin/classes');
    return response.data;
  },

  /**
   * Fetch a single class detail.
   */
  async get(id) {
    const response = await api.get(`/admin/classes/${id}`);
    return response.data;
  },

  /**
   * Create a new class.
   */
  async create(data) {
    const response = await api.post('/admin/classes', data);
    return response.data;
  },

  /**
   * Update class details.
   */
  async update(id, data) {
    const response = await api.put(`/admin/classes/${id}`, data);
    return response.data;
  },

  /**
   * Delete a class.
   */
  async delete(id) {
    const response = await api.delete(`/admin/classes/${id}`);
    return response.data;
  }
};

export default classService;
