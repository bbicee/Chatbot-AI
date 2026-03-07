import React, { useContext, useState } from "react";
import "./Sidebar.css";
import { assets } from "../../assets/assets";
import { Context } from "../../context/Context";
import { useNavigate, useLocation } from "react-router-dom"; // Import từ react-router-dom

const Sidebar = () => {
  const [extended, setExtended] = useState(false);
  const { onSent, prevPrompts, setRecentPrompt, newChat } = useContext(Context);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Xác định xem URL đang ở đâu để sáng màu nút tương ứng
  const isChatMode = location.pathname.includes("/chatbot");
  const isDocsMode = location.pathname.includes("/documents");

  const loadPrompt = async (prompt) => {
    setRecentPrompt(prompt);
    await onSent(prompt);
  };

  const handleNewChat = () => {
    if (newChat) newChat();
    navigate("/chatbot"); // Đổi URL sang chatbot
  };

  const handleFolderTab = () => {
    navigate("/documents"); // Đổi URL sang documents
  };

  return (
    <div className="sidebar">
      <div className="top">
        <img
          onClick={() => setExtended((prev) => !prev)}
          className="menu"
          src={assets.menu_icon}
          alt=""
        />
        
        <div className="action-buttons">
            <div onClick={handleNewChat} className={`new-chat ${isChatMode ? 'active-tab' : ''}`}>
              <img src={assets.plus_icon} alt="" />
              {extended ? <p>Cuộc trò chuyện mới</p> : null}
            </div>
            
            <div onClick={handleFolderTab} className={`new-chat ${isDocsMode ? 'active-tab' : ''}`}>
               <span style={{fontSize: "20px", marginLeft: "10px"}}>📁</span>
              {extended ? <p style={{marginLeft: "10px"}}>Tài liệu học tập</p> : null}
            </div>
        </div>

        {extended ? (
          <div className="recent">
            <p className="recent-title">Gần đây</p>
            {prevPrompts.map((item, index) => {
              return (
                <div key={index} onClick={() => loadPrompt(item)} className="recent-entry">
                  <img src={assets.message_icon} alt="message" />
                  <p>{item.slice(0, 18)}...</p>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="bottom">
        <div className="bottom-item recent-entry">
          <img src={assets.question_icon} alt="help" />
          {extended ? <p>Trợ giúp</p> : null}
        </div>
        <div className="bottom-item recent-entry">
          <img src={assets.history_icon} alt="history" />
          {extended ? <p>Hoạt động</p> : null}
        </div>
        <div className="bottom-item recent-entry">
          <img src={assets.setting_icon} alt="settings" />
          {extended ? <p>Cài đặt</p> : null}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;