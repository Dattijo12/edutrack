import api from './api';

const guardianService = {
  /**
   * Fetch Guardian profile & linked students
   */
  async getDashboard() {
    const res = await api.get('/guardian/dashboard');
    return res.data;
  },

  /**
   * Fetch report card for a specific student linked to the Guardian
   */
  async getStudentResults(studentId, term, session) {
    const params = {};
    if (term) params.term = term;
    if (session) params.session = session;
    const res = await api.get(`/guardian/students/${studentId}/results`, { params });
    return res.data;
  }
};

export default guardianService;
