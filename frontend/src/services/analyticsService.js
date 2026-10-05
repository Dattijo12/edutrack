import api from './api';

/**
 * Service module for fetching dashboard analytics data.
 */
const analyticsService = {
  /**
   * Fetch enrollment statistics grouped by class based on user role.
   * @param {string} role User role ('admin', 'super_admin', 'exam_officer', etc.)
   * @returns {Promise<Array>} Array of { class_name, student_count } objects.
   */
  async getEnrollmentByClass(role = 'admin') {
    const endpoint = (role === 'admin' || role === 'super_admin') 
      ? '/admin/analytics/enrollment' 
      : '/exam-officer/analytics/enrollment';

    const res = await api.get(endpoint);
    return res.data;
  },
};

export default analyticsService;
