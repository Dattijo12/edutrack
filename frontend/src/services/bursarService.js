import api from './api';

const bursarService = {
  /**
   * Fetch all school classes for Bursar dropdowns (GET /api/bursar/classes)
   */
  async getClasses() {
    const res = await api.get('/bursar/classes');
    return res.data;
  },

  /**
   * Fetch students filtered by class for cascading dropdown (GET /api/bursar/students-by-class)
   */
  async getStudentsByClass(classId) {
    const res = await api.get('/bursar/students-by-class', { params: { class_id: classId } });
    return res.data;
  },

  /**
   * Fetch all payments history from GET /api/bursar/payments
   */
  async getPayments() {
    const res = await api.get('/bursar/payments');
    return res.data;
  },

  /**
   * Record a new payment via POST /api/bursar/payments
   */
  async createPayment(data) {
    const res = await api.post('/bursar/payments', data);
    return res.data;
  },

  /**
   * Fetch student fee status list
   */
  async getStudents(classId = '', status = 'all', search = '') {
    const res = await api.get('/bursar/students', { params: { class_id: classId, status, search } });
    return res.data;
  },

  /**
   * Record payment (legacy endpoint fallback)
   */
  async recordPayment(data) {
    const res = await api.post('/bursar/record-payment', data);
    return res.data;
  },

  /**
   * Toggle student fee clearance status
   */
  async toggleClearance(studentId, fee_cleared_status) {
    const res = await api.post(`/bursar/students/${studentId}/toggle-clearance`, { fee_cleared_status });
    return res.data;
  }
};

export default bursarService;
