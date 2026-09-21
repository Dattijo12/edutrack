import api from './api';

const examOfficerService = {
  /**
   * Fetch all student result entries pending verification and approval.
   */
  async getPendingResults() {
    const res = await api.get('/exam-officer/results/pending');
    return res.data;
  },

  /**
   * Approve a specific student result record.
   */
  async approveResult(id) {
    const res = await api.post(`/exam-officer/results/${id}/approve`);
    return res.data;
  },

  /**
   * Reject a specific student result record with mandatory feedback reason.
   * Sends both 'rejection_reason' and 'reason' keys to ensure backend compatibility.
   */
  async rejectResult(id, rejectionReason) {
    const reasonText = typeof rejectionReason === 'object' && rejectionReason !== null
      ? (rejectionReason.rejection_reason || rejectionReason.reason || '')
      : String(rejectionReason || '');

    const res = await api.post(`/exam-officer/results/${id}/reject`, { 
      rejection_reason: reasonText,
      reason: reasonText 
    });
    return res.data;
  },

  /**
   * Fetch class master broadsheet grid for the specified class, term, and academic session.
   */
  async getBroadsheet(classId, term = '1st Term', session = '2025/2026') {
    const res = await api.get(`/exam-officer/broadsheet/${classId}`, { params: { term, session } });
    return res.data;
  },

  /**
   * Generate comprehensive student report card with QR code verification hash.
   */
  async getReportCard(studentId, term = '1st Term', session = '2025/2026') {
    const res = await api.get(`/exam-officer/report-card/${studentId}`, { params: { term, session } });
    return res.data;
  },

  /**
   * Fetch all active school class arms.
   */
  async getClasses() {
    const res = await api.get('/exam-officer/classes');
    return res.data;
  },

  /**
   * Fetch student roster for a specific school class.
   */
  async getStudentsByClass(classId) {
    const res = await api.get('/exam-officer/students', { params: { class_id: classId } });
    return res.data;
  },

  /**
   * Verify authenticity of a student report card using verification hash.
   */
  async verifyResult(hash) {
    const res = await api.get(`/verify-result/${hash}`);
    return res.data;
  }
};

export default examOfficerService;
