/**
 * Authentication API Service
 * 
 * This service handles all authentication-related API calls.
 * Update the API_BASE_URL to point to your backend server.
 * 
 * Example usage in Login.jsx:
 *   const result = await loginAPI.login(username, password);
 *   if (result.success) {
 *     localStorage.setItem('authToken', result.token);
 *     navigate('/admin');
 *   }
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Authentication API endpoints
 */
export const loginAPI = {
  /**
   * Login with username and password
   * @param {string} username - User's username/email
   * @param {string} password - User's password
   * @returns {Promise<{success: boolean, token?: string, user?: Object, message?: string}>}
   */
  async login(username, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        return {
          success: false,
          message: error.message || 'Đăng nhập thất bại',
        };
      }

      const data = await response.json();
      return {
        success: true,
        token: data.token,
        user: data.user,
      };
    } catch (error) {
      console.error('Login API error:', error);
      return {
        success: false,
        message: 'Có lỗi kết nối đến máy chủ. Vui lòng thử lại.',
      };
    }
  },

  /**
   * Logout and invalidate session
   * @param {string} token - Auth token to invalidate
   * @returns {Promise<{success: boolean}>}
   */
  async logout(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return { success: response.ok };
    } catch (error) {
      console.error('Logout API error:', error);
      return { success: false };
    }
  },

  /**
   * Verify if current token is still valid
   * @param {string} token - Auth token to verify
   * @returns {Promise<{success: boolean, user?: Object}>}
   */
  async verifyToken(token) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return { success: false };
      }

      const data = await response.json();
      return {
        success: true,
        user: data.user,
      };
    } catch (error) {
      console.error('Token verification error:', error);
      return { success: false };
    }
  },

  /**
   * Request password reset email
   * @param {string} email - User's email
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async requestPasswordReset(email) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      return {
        success: response.ok,
        message: data.message || 'Yêu cầu đã được gửi',
      };
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra. Vui lòng thử lại.',
      };
    }
  },

  /**
   * Reset password with reset token
   * @param {string} token - Reset token from email
   * @param {string} newPassword - New password
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async resetPassword(token, newPassword) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password: newPassword }),
      });

      const data = await response.json();
      return {
        success: response.ok,
        message: data.message || 'Mật khẩu đã được đặt lại',
      };
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        message: 'Có lỗi xảy ra. Vui lòng thử lại.',
      };
    }
  },
};

/**
 * Helper to add auth token to API requests
 * @param {Headers} headers - Existing headers
 * @param {string} token - Auth token
 * @returns {Headers}
 */
export function addAuthHeader(headers, token) {
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
}

/**
 * Helper to check if token is valid (not expired)
 * @param {string} token - JWT token
 * @returns {boolean}
 */
export function isTokenValid(token) {
  if (!token) return false;

  try {
    // JWT has 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    // Decode payload (second part)
    const payload = JSON.parse(atob(parts[1]));

    // Check expiration
    if (payload.exp) {
      return Date.now() < payload.exp * 1000;
    }

    return true;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
}

/**
 * Get stored auth token from localStorage
 * @returns {string|null}
 */
export function getAuthToken() {
  return localStorage.getItem('authToken');
}

/**
 * Store auth token in localStorage
 * @param {string} token
 */
export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('authToken', token);
  }
}

/**
 * Clear auth token from localStorage
 */
export function clearAuthToken() {
  localStorage.removeItem('authToken');
}
