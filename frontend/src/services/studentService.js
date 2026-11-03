import api from './api';

const studentService = {
  /**
   * Fetch all students with optional search and class filter.
   */
  async getAll(search = '', classId = '') {
    const params = {};
    if (search) params.search = search;
    if (classId) params.class_id = classId;
    const response = await api.get('/admin/students', { params });
    return response.data;
  },

  /**
   * Alias for getAll to maintain interface compatibility across pages.
   */
  async getAllStudents(search = '', classId = '') {
    return this.getAll(search, classId);
  },

  /**
   * Fetch list of enrolled students for a specific class ID.
   * @param {number|string} classId
   */
  async getByClass(classId) {
    const response = await api.get('/teacher/students', { params: { class_id: classId } });
    return response.data;
  },

  /**
   * Fetch a single student.
   */
  async get(id) {
    const response = await api.get(`/admin/students/${id}`);
    return response.data;
  },

  /**
   * Register a new student.
   */
  async create(data) {
    const response = await api.post('/admin/students', data);
    return response.data;
  },

  /**
   * Update student profile.
   */
  async update(id, data) {
    const response = await api.put(`/admin/students/${id}`, data);
    return response.data;
  },

  /**
   * Delete a student.
   */
  async delete(id) {
    const response = await api.delete(`/admin/students/${id}`);
    return response.data;
  },

  /**
   * Student Portal Login API
   */
  async studentLogin(admissionNumber, password) {
    const response = await api.post('/student/login', {
      admission_number: admissionNumber,
      password: password,
    });
    return response.data;
  },

  /**
   * Fetch Authenticated Student's Results API
   */
  async getStudentResults(session = '', term = '') {
    const params = {};
    if (session) params.session = session;
    if (term) params.term = term;
    const response = await api.get('/student/results', { params });
    return response.data;
  },

  /**
   * Student Portal Logout API
   */
  async studentLogout() {
    try {
      const response = await api.post('/student/logout');
      return response.data;
    } catch (err) {
      console.warn('Student logout warning:', err);
    }
  },

  /**
   * Download the server-generated PDF report card.
   * Returns a Blob that the caller can use to trigger a browser download.
   *
   * @param {string} session - Academic session (e.g. "2025/2026")
   * @param {string} term    - Term name (e.g. "1st Term")
   * @returns {Promise<Blob>}
   */
  async downloadReportCard(session = '', term = '') {
    const params = {};
    if (session) params.session = session;
    if (term) params.term = term;
    const response = await api.get('/student/report-card/download', {
      params,
      responseType: 'blob',
    });
    return response.data;
  },
};

export default studentService;
