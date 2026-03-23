const apiUrl = import.meta.env.VITE_API_URL;

export const loginAPI = {
  async login(username, password) {
    try {
      const response = await fetch(`${apiUrl}/auth/login`, {
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

  async logout(token) {
    try {
      const response = await fetch(`${apiUrl}/auth/logout`, {
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

  async verifyToken(token) {
    try {
      const response = await fetch(`${apiUrl}/auth/verify`, {
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

  async requestPasswordReset(email) {
    try {
      const response = await fetch(`${apiUrl}/auth/forgot-password`, {
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

  async resetPassword(token, newPassword) {
    try {
      const response = await fetch(`${apiUrl}/auth/reset-password`, {
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

export function addAuthHeader(headers, token) {
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
}

export function isTokenValid(token) {
  if (!token) return false;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const payload = JSON.parse(atob(parts[1]));

    if (payload.exp) {
      return Date.now() < payload.exp * 1000;
    }

    return true;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
}

export function getAuthToken() {
  return localStorage.getItem('authToken');
}

export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('authToken', token);
  }
}

export function clearAuthToken() {
  localStorage.removeItem('authToken');
}
