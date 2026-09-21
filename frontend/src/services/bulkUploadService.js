import api from './api';

/**
 * Service module for bulk data upload operations.
 * Handles student registration and result score imports via JSON payloads.
 */
const bulkUploadService = {
  /**
   * Upload an array of student records for batch registration.
   * Existing admission numbers are skipped (not overwritten).
   * @param {Array} students - Array of student objects.
   * @returns {Promise<Object>} Response with inserted count and skipped rows.
   */
  async uploadStudents(students) {
    const res = await api.post('/admin/bulk-upload/students', { students });
    return res.data;
  },

  /**
   * Upload an array of result records for batch upsert.
   * Existing results are updated; new ones are inserted.
   * @param {Array} results - Array of result objects.
   * @returns {Promise<Object>} Response with upserted count and error rows.
   */
  async uploadResults(results) {
    const res = await api.post('/admin/bulk-upload/results', { results });
    return res.data;
  },
};

export default bulkUploadService;
