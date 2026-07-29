import api from './api';

const examOfficerService = {
  /**
   * Fetch all results that are awaiting approval.
   */
  async getPendingResults() {
    const response = await api.get('/exam-officer/results/pending');
    return response.data;
  },

  /**
   * Approve a specific result.
   */
  async approveResult(resultId) {
    const response = await api.post(`/exam-officer/results/${resultId}/approve`);
    return response.data;
  },

  /**
   * Reject a specific result.
   */
  async rejectResult(resultId) {
    const response = await api.post(`/exam-officer/results/${resultId}/reject`);
    return response.data;
  },

  /**
   * Generate a class report.
   */
  async getClassReport(classId) {
    const response = await api.get(`/exam-officer/reports/class/${classId}`);
    return response.data;
  }
};

export default examOfficerService;
