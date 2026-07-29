import api from './api';

const authService = {
  /**
   * Log in a user with email and password.
   */
  async login(email, password) {
    const response = await api.post('/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  /**
   * Log out the current user.
   */
  async logout() {
    try {
      await api.post('/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  /**
   * Retrieve the current user's profile info.
   */
  async getProfile() {
    const response = await api.get('/profile');
    return response.data;
  },
};

export default authService;
