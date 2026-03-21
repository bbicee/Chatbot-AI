import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { assets } from "../../assets/assets";
import "./AdminSidebar.css";

const AdminSidebar = ({ activePage, onNavigate, onLogout }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();

  return (
    <div className={`db-sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* LOGO */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">AI</div>
        <span className="sidebar-logo-text">EduBot Admin</span>
      </div>

      {/* TOP NAV */}
      <div className="sidebar-top">
        <div className="menu-btn" onClick={() => setCollapsed((p) => !p)}>
          <img src={assets.menu_icon} alt="menu" />
        </div>

        <div className="db-nav-section-label">Tổng quan</div>
        <button
          className={`nav-item ${activePage === "overview" ? "active" : ""}`}
          onClick={() => onNavigate("overview")}
        >
          <span className="nav-icon">📊</span>
          <span className="nav-label">Tổng quan</span>
        </button>

        <div className="db-nav-section-label" style={{ marginTop: 6 }}>Quản lý</div>
        <button
          className={`nav-item ${activePage === "subjects" ? "active" : ""}`}
          onClick={() => onNavigate("subjects")}
        >
          <span className="nav-icon">📚</span>
          <span className="nav-label">Quản lý môn học</span>
        </button>
        <button
          className={`nav-item ${activePage === "accounts" ? "active" : ""}`}
          onClick={() => onNavigate("accounts")}
        >
          <span className="nav-icon">👥</span>
          <span className="nav-label">Quản lý tài khoản</span>
        </button>

        <div className="db-nav-section-label" style={{ marginTop: 6 }}>Tài liệu</div>
        <button
          className={`nav-item ${activePage === "documents" ? "active" : ""}`}
          onClick={() => onNavigate("documents")}
        >
          <span className="nav-icon">📖</span>
          <span className="nav-label">Xem tài liệu</span>
        </button>
      </div>

      {/* BOTTOM */}
      <div className="sidebar-bottom">
        <button className="nav-item" onClick={() => navigate("/chatbot")}>
          <span className="nav-icon">🤖</span>
          <span className="nav-label">Mở Chatbot</span>
        </button>
        <button className="db-logout-btn" onClick={onLogout}>
          <span className="nav-icon">🚪</span>
          <span className="nav-label">Đăng xuất</span>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
