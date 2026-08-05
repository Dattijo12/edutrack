import api from './api';

const examOfficerService = {
  async getPendingResults() {
    const res = await api.get('/exam-officer/results/pending');
    return res.data;
  },

  async approveResult(id) {
    const res = await api.post(`/exam-officer/results/${id}/approve`);
    return res.data;
  },

  async rejectResult(id) {
    const res = await api.post(`/exam-officer/results/${id}/reject`);
    return res.data;
  },

  async getBroadsheet(classId, term = '1st Term', session = '2025/2026') {
    const res = await api.get(`/exam-officer/broadsheet/${classId}`, { params: { term, session } });
    return res.data;
  },

  async getReportCard(studentId, term = '1st Term', session = '2025/2026') {
    const res = await api.get(`/exam-officer/report-card/${studentId}`, { params: { term, session } });
    return res.data;
  },

  async verifyResult(hash) {
    const res = await api.get(`/verify-result/${hash}`);
    return res.data;
  }
};

export default examOfficerService;
