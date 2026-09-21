import api from './api';

const formMasterService = {
  async getAssignedClass() {
    const res = await api.get('/form-master/assigned-class');
    return res.data;
  },

  async updateRemarks(data) {
    const res = await api.post('/form-master/update-remarks', data);
    return res.data;
  },

  async getAttendance(classId, date) {
    const res = await api.get(`/form-master/attendance?class_id=${classId}&date=${date}`);
    return res.data;
  },

  async saveAttendance(data) {
    const res = await api.post('/form-master/attendance', data);
    return res.data;
  }
};

export default formMasterService;
