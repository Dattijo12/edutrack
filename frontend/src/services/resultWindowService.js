import api from './api';

const resultWindowService = {
  /**
   * Fetch all result windows from GET /api/admin/result-windows
   */
  async getAll() {
    const res = await api.get('/admin/result-windows');
    return res.data;
  },

  /**
   * Create or update a result window POST /api/admin/result-windows
   */
  async create(data) {
    const res = await api.post('/admin/result-windows', data);
    return res.data;
  },

  /**
   * Toggle is_open status POST /api/admin/result-windows/:id/toggle
   */
  async toggle(id) {
    const res = await api.post(`/admin/result-windows/${id}/toggle`);
    return res.data;
  },

  /**
   * Delete a result window DELETE /api/admin/result-windows/:id
   */
  async delete(id) {
    const res = await api.delete(`/admin/result-windows/${id}`);
    return res.data;
  }
};

export default resultWindowService;
