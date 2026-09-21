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

  /**
   * Fetch results that were rejected and need correction.
   */
  async getRejectedResults() {
    const response = await api.get('/teacher/results-rejected');
    return response.data;
  },

  /**
   * Download the CSV results template (optionally pre-populated with class students).
   * Explicitly handles responseType: 'blob' and creates a temporary URL for native browser download.
   */
  async downloadTemplate(classId) {
    try {
      const response = await api.get('/teacher/results/template', {
        params: classId ? { class_id: classId } : {},
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'result_template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download CSV result template:', err);
      if (err.response && err.response.data instanceof Blob) {
        const text = await err.response.data.text();
        try {
          const json = JSON.parse(text);
          throw new Error(json.message || 'Failed to download template.');
        } catch (parseErr) {
          throw new Error(text || 'Failed to download template.');
        }
      }
      throw err;
    }
  },

  /**
   * Upload CSV file for batch result entry with row-level error feedback.
   */
  async bulkUploadResults(formData) {
    const response = await api.post('/teacher/results/bulk-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

export default resultService;
