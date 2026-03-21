import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../../services/userService";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ─── Validation ───────────────────────────────────────────────────────────
  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = "Vui lòng nhập tên đăng nhập";
    }

    if (!formData.password) {
      newErrors.password = "Vui lòng nhập mật khẩu";
    } else if (formData.password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ─── Handle Submit ────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const result = await loginUser(formData.username, formData.password);

      if (result.success) {
        // Save token and user info
        localStorage.setItem('token', result.data.token);
        localStorage.setItem('user', JSON.stringify(result.data.user));
        if (formData.rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }

        // Route based on role: 0 = admin, others = user
        // if (result.data.user.role === 1) {
        //   navigate('/admin');
        // } else {
        //   navigate('/chatbot');
        // }
        navigate('/admin');
      } else {
        setErrors({ submit: result.message || 'Đăng nhập thất bại' });
      }
    } catch (error) {
      setErrors({ submit: "Có lỗi xảy ra. Vui lòng thử lại." });
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Handle Input Change ──────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        {/* Left Side - Branding */}
        <div className="login-branding">
          <div className="login-logo">
            <div className="logo-icon">📚</div>
            <h1>EduChat AI</h1>
            <p>Hệ thống hỗ trợ học tập thông minh</p>
          </div>
          <div className="login-features">
            <div className="feature-item">
              <span className="feature-icon">✨</span>
              <div>
                <h3>Trợ lý thông minh</h3>
                <p>Giải đáp mọi câu hỏi về học tập</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📖</span>
              <div>
                <h3>Tài liệu đầy đủ</h3>
                <p>Quản lý giáo trình và bài giảng</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🎯</span>
              <div>
                <h3>Hiệu quả cao</h3>
                <p>Học tập nhanh chóng và hiệu quả</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="login-form-container">
          <div className="login-form-header">
            <h2>Đăng nhập</h2>
            <p>Vui lòng đăng nhập để tiếp tục</p>
          </div>

          {errors.submit && (
            <div className="login-error-banner">
              <span className="error-icon">⚠️</span>
              <span>{errors.submit}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            {/* Username Field */}
            <div className="form-group">
              <label htmlFor="username">Tên đăng nhập</label>
              <div className="input-wrapper">
                <span className="input-icon">👤</span>
                <input
                  id="username"
                  type="text"
                  name="username"
                  placeholder="Nhập tên đăng nhập"
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className={errors.username ? "input-error" : ""}
                />
              </div>
              {errors.username && (
                <span className="error-message">{errors.username}</span>
              )}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password">Mật khẩu</label>
              <div className="input-wrapper">
                <span className="input-icon">🔐</span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Nhập mật khẩu"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  className={errors.password ? "input-error" : ""}
                />
                <button
                  type="button"
                  className="show-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  title={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
              {errors.password && (
                <span className="error-message">{errors.password}</span>
              )}
            </div>

            {/* Remember & Forgot Password */}
            <div className="form-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
                <span>Ghi nhớ đăng nhập</span>
              </label>
              <a href="#" className="forgot-link">
                Quên mật khẩu?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="login-btn"
              disabled={isLoading}
            >
              {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          {/* Support Text */}
          <div className="login-footer">
            <p>
              Cần hỗ trợ?{" "}
              <a href="mailto:support@educhat.edu.vn">Liên hệ quản trị viên</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
