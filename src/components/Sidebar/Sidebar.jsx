import React, { useContext, useState } from "react";
import "./Sidebar.css";
import { assets } from "../../assets/assets";
import { Context } from "../../context/ContextDef";
import { useNavigate, useLocation } from "react-router-dom";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { conversations, newChat, loadConversation, deleteConversation, activeConvId } = useContext(Context);
  const navigate = useNavigate();
  const location = useLocation();

  const isChatMode = location.pathname.includes("/chatbot");
  const isDocsMode = location.pathname.includes("/documents");

  const handleNewChat = () => {
    newChat();
    navigate("/chatbot", { replace: true });
  };

  const handleLoadPrompt = (conv) => {
    loadConversation(conv);
    navigate("/chatbot", { replace: true });
  };

  return (
    <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {/* LOGO ROW */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">AI</div>
        <span className="sidebar-logo-text">HCA Chatbot</span>
      </div>

      <div className="sidebar-top">
        <div className="menu-btn" onClick={() => setCollapsed((p) => !p)}>
          <img src={assets.menu_icon} alt="menu" />
        </div>

        {/* NEW CHAT */}
        <div className={`new-chat-btn ${isChatMode ? "active" : ""}`} onClick={handleNewChat}>
          <img src={assets.plus_icon} alt="new chat" />
          <span className="nav-label">Cuộc trò chuyện mới</span>
        </div>

        {/* TRANG TÀI LIỆU */}
        <div className={`nav-item ${isDocsMode ? "active" : ""}`} onClick={() => navigate("/documents")}>
          <span className="nav-emoji">📁</span>
          <span className="nav-label">Tài liệu học tập</span>
        </div>

        {/* RECENT CONVERSATIONS */}
        {conversations.length > 0 && (
          <>
            <div className="divider" />
            <p className="recent-title">Gần đây</p>
            {conversations.slice(0, 8).map((conv) => (
              <div key={conv.id} className={`recent-entry ${conv.id === activeConvId ? "active" : ""}`} onClick={() => handleLoadPrompt(conv)}>
                <img src={assets.message_icon} alt="" />
                <span className="nav-label">{conv.prompt.slice(0, 24)}{conv.prompt.length > 24 ? "…" : ""}</span>
                <button
                  className="delete-conv-btn"
                  onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                  title="Xóa"
                >✕</button>
              </div>
            ))}
          </>
        )}
      </div>

      {/* BOTTOM SECTION */}
      <div className="sidebar-bottom">
        <div className="nav-item" onClick={() => window.location.href = "/home.html"}>
          <span className="nav-emoji">🏠</span>
          <span className="nav-label">Trang chủ</span>
        </div>
        <div className="nav-item">
          <img src={assets.question_icon} alt="help" />
          <span className="nav-label">Trợ giúp</span>
        </div>
        <div className="nav-item">
          <img src={assets.setting_icon} alt="settings" />
          <span className="nav-label">Cài đặt</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;