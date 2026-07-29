import api from './api';

const resultService = {
  /**
   * Fetch all classes for teacher selection.
   */
  async getClasses() {
    const response = await api.get('/teacher/classes');
    return response.data;
  },

  /**
   * Fetch all subjects for teacher selection.
   */
  async getSubjects() {
    const response = await api.get('/teacher/subjects');
    return response.data;
  },

  /**
   * Fetch students belonging to a specific class.
   */
  async getStudents(classId) {
    const response = await api.get('/teacher/students', { params: { class_id: classId } });
    return response.data;
  },

  /**
   * Submit a new result entry.
   */
  async createResult(payload) {
    const response = await api.post('/teacher/results', payload);
    return response.data;
  },

  /**
   * Update an existing result entry.
   */
  async updateResult(resultId, payload) {
    const response = await api.put(`/teacher/results/${resultId}`, payload);
    return response.data;
  },
};

export default resultService;
