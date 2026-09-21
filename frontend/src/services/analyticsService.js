import api from './api';

/**
 * Service module for fetching dashboard analytics data.
 */
const analyticsService = {
  /**
   * Fetch enrollment statistics grouped by class.
   * @returns {Promise<Array>} Array of { class_name, student_count } objects.
   */
  async getEnrollmentByClass() {
    const res = await api.get('/admin/analytics/enrollment');
    return res.data;
  },
};

export default analyticsService;
