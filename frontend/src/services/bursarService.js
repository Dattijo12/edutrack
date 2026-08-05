import api from './api';

const bursarService = {
  async getStudents(classId = '', status = 'all', search = '') {
    const res = await api.get('/bursar/students', { params: { class_id: classId, status, search } });
    return res.data;
  },

  async recordPayment(data) {
    const res = await api.post('/bursar/record-payment', data);
    return res.data;
  },

  async toggleClearance(studentId, fee_cleared_status) {
    const res = await api.post(`/bursar/students/${studentId}/toggle-clearance`, { fee_cleared_status });
    return res.data;
  }
};

export default bursarService;
