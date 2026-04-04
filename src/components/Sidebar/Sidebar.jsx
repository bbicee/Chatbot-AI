import React, { useContext, useState } from "react";
import "./Sidebar.css";
import { assets } from "../../assets/assets";
import { Context } from "../../context/ContextDef";
import { useNavigate, useLocation } from "react-router-dom";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { conversations, newChat, newQuizChat, loadConversation, deleteConversation, activeConvId } = useContext(Context);
  const navigate = useNavigate();
  const location = useLocation();

  const isChatMode = location.pathname.includes("/chatbot");
  const isDocsMode = location.pathname.includes("/documents");

  const handleNewChat = () => {
    newChat();
    navigate("/chatbot", { replace: true });
  };

  const handleNewQuizChat = () => {
    newQuizChat();
    navigate("/chatbot", { replace: true });
  };

  const handleLoadPrompt = (conv) => {
    loadConversation(conv);
    navigate("/chatbot", { replace: true });
  };

  return (
    <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">AI</div>
        <span className="sidebar-logo-text">HCA Chatbot</span>
      </div>

      <div className="sidebar-top">
        <div className="menu-btn" onClick={() => setCollapsed((p) => !p)}>
          <img src={assets.menu_icon} alt="menu" />
        </div>

        <div className={`new-chat-btn ${isChatMode ? "active" : ""}`} onClick={handleNewChat}>
          <img src={assets.plus_icon} alt="new chat" />
          <span className="nav-label">Cuộc trò chuyện mới</span>
        </div>

        <div className="new-quiz-btn" onClick={handleNewQuizChat}>
          <span className="new-quiz-icon"><i className="fas fa-bullseye" /></span>
          <span className="nav-label">Tạo trắc nghiệm mới</span>
        </div>

        <div className={`nav-item ${isDocsMode ? "active" : ""}`} onClick={() => navigate("/documents")}>
          <span className="nav-emoji"><i className="fas fa-folder" /></span>
          <span className="nav-label">Tài liệu học tập</span>
        </div>

        {conversations.length > 0 && (
          <>
            <div className="divider" />
            <p className="recent-title">Gần đây</p>
            <div className="recent-conversations">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`recent-entry ${conv.id === activeConvId ? "active" : ""} ${conv.type === "quiz" ? "quiz-entry" : ""}`}
                  onClick={() => handleLoadPrompt(conv)}
                >
                  <span className="entry-icon">{conv.type === "quiz" ? <i className="fas fa-bullseye" /> : <i className="fas fa-comment" />}</span>
                  <span className="nav-label">{(conv.title || 'Cuộc trò chuyện').replace(/^\[Quiz\]\s*/,'').slice(0, 24)}{(conv.title || '').replace(/^\[Quiz\]\s*/,'').length > 24 ? "…" : ""}</span>
                  <button
                    className="delete-conv-btn"
                    onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                    title="Xóa"
                  ><i className="fas fa-times" /></button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="sidebar-bottom">
        <div className="nav-item" onClick={() => window.location.href = "/home.html"}>
          <span className="nav-emoji"><i className="fas fa-home" /></span>
          <span className="nav-label">Trang chủ</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;