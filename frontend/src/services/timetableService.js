import api from './api';

/**
 * Timetable API Service
 * Handles communications for fetching class schedules, creating schedule slots,
 * and deleting timetable records.
 */
const timetableService = {
  /**
   * Fetch timetable for a specific class ID.
   * Accessible by admin, teachers, and enrolled students of that class.
   *
   * @param {number|string} classId
   * @returns {Promise<{status: string, class: Object, data: Array}>}
   */
  async getClassTimetable(classId) {
    const response = await api.get(`/timetable/class/${classId}`);
    return response.data;
  },

  /**
   * Create a new timetable slot.
   * Restricted to admin / super_admin.
   *
   * @param {Object} payload
   * @param {number} payload.school_class_id
   * @param {number} payload.subject_id
   * @param {number} payload.teacher_id
   * @param {string} payload.day_of_week
   * @param {string} payload.start_time
   * @param {string} payload.end_time
   * @returns {Promise<Object>}
   */
  async createTimetableSlot(payload) {
    const response = await api.post('/timetable', payload);
    return response.data;
  },

  /**
   * Delete a timetable entry by its ID.
   * Restricted to admin / super_admin.
   *
   * @param {number|string} id
   * @returns {Promise<Object>}
   */
  async deleteTimetableSlot(id) {
    const response = await api.delete(`/timetable/${id}`);
    return response.data;
  },

  /**
   * Fetch all school classes for selector dropdowns based on current role.
   *
   * @param {string} role
   * @returns {Promise<Array>}
   */
  async getClassesForSelector(role = 'admin') {
    try {
      if (role === 'teacher' || role === 'form_master') {
        const res = await api.get('/teacher/classes');
        return Array.isArray(res.data) ? res.data : (res.data?.data || []);
      }
      if (role === 'exam_officer') {
        const res = await api.get('/exam-officer/classes');
        return Array.isArray(res.data) ? res.data : (res.data?.data || []);
      }
      // Default to admin endpoint
      const res = await api.get('/admin/classes');
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    } catch (err) {
      // Fallback attempt to teacher endpoint if admin endpoint gives 403
      try {
        const fallback = await api.get('/teacher/classes');
        return Array.isArray(fallback.data) ? fallback.data : (fallback.data?.data || []);
      } catch (_e) {
        throw err;
      }
    }
  },

  /**
   * Fetch all subjects for the admin modal selection.
   *
   * @returns {Promise<Array>}
   */
  async getSubjects() {
    try {
      const res = await api.get('/admin/subjects');
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    } catch (_err) {
      const fallback = await api.get('/teacher/subjects');
      return Array.isArray(fallback.data) ? fallback.data : (fallback.data?.data || []);
    }
  },

  /**
   * Fetch all teachers for admin slot assignment.
   *
   * @returns {Promise<Array>}
   */
  async getTeachers() {
    const res = await api.get('/admin/users', { params: { role: 'all' } });
    const users = Array.isArray(res.data) ? res.data : (res.data?.data || []);
    // Filter to instructional staff
    return users.filter(u => ['teacher', 'form_master', 'admin'].includes(u.role));
  }
};

export default timetableService;
