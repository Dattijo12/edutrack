import api from './api';

const authService = {
  async login(loginId, password) {
    const payload = { login_id: loginId, password };
    console.log('Sending API login payload:', payload);

    try {
      const response = await api.post('/login', payload, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
      }
      return response.data;
    } catch (error) {
      console.error('Validation Errors from Backend:', error.response?.data?.errors || error.response?.data);
      throw error;
    }
  },

  async logout() {
    try {
      await api.post('/logout');
    } catch (e) {
      console.error(e);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  async getProfile() {
    const response = await api.get('/profile');
    return response.data;
  },

  async changePassword(data) {
    const response = await api.post('/change-password', data);
    return response.data;
  },

  async uploadSignature(file) {
    const formData = new FormData();
    formData.append('signature', file);
    const response = await api.post('/profile/signature', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    if (response.data?.user) {
      const currentUser = authService.getCurrentUser() || {};
      const updated = { ...currentUser, ...response.data.user, signature_url: response.data.signature_url };
      localStorage.setItem('user', JSON.stringify(updated));
    }
    return response.data;
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
};

export default authService;
