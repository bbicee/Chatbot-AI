import React, { useContext, useState } from "react";
import "./Sidebar.css";
import { assets } from "../../assets/assets";
import { Context } from "../../context/Context";

const Sidebar = () => {
  const [extended, setExtended] = useState(false);
  const { onSent, prevPrompts, setRecentPrompt, newChat } = useContext(Context);

  const loadPrompt = async (prompt) => {
    setRecentPrompt(prompt);
    await onSent(prompt);
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
        <div onClick={() => newChat()} className="new-chat">
          <img src={assets.plus_icon} alt="" />
          {extended ? <p>Cuộc trò chuyện mới</p> : null}
        </div>
        {extended ? (
          <div className="recent">
            <p className="recent-title">Gần đây</p>
            {prevPrompts.map((item, index) => {
              return (
                <div onClick={() => loadPrompt(item)} className="recent-entry">
                  <img src={assets.message_icon} alt="" />
                  <p>{item.slice(0, 18)}...</p>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="bottom">
        <div className="bottom-item recent-entry ">
          <img src={assets.question_icon} alt="" />
          {extended ? <p>Trợ giúp</p> : null}
        </div>
        <div className="bottom-item recent-entry ">
          <img src={assets.history_icon} alt="" />
          {extended ? <p>Hoạt động</p> : null}
        </div>
        <div className="bottom-item recent-entry ">
          <img src={assets.setting_icon} alt="" />
          {extended ? <p>Cài đặt</p> : null}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
