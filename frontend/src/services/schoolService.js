import api from './api';

const schoolService = {
  async getSettings() {
    const response = await api.get('/school-settings');
    return response.data;
  }
};

export default schoolService;
