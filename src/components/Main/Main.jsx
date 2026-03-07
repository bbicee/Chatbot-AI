import React, { useContext, useRef, useEffect, useState } from "react";
import "./Main.css";
import { assets } from "../../assets/assets";
import { Context } from "../../context/ContextDef";
import ReactMarkdown from "react-markdown";
import { useLocation } from "react-router-dom";

// ─── Static data ───────────────────────────────────────────────────────────────

const DOCUMENT_DATA = [
  {
    id: 1,
    title: "Chương 1",
    files: [
      { id: 101, name: "Bài giảng",       url: "/data/pdfs/C1/chuong1.pdf" },
      { id: 102, name: "Bài thực hành",   url: "/data/pdfs/C1/thuchanh_chuong1.pdf" },
    ],
  },
  {
    id: 2,
    title: "Chương 2",
    files: [
      { id: 201, name: "Bài 1", url: "/data/pdfs/C2/bai1.pdf" },
      { id: 202, name: "Bài 2", url: "/data/pdfs/C2/bai2.pdf" },
      { id: 203, name: "Bài 3", url: "/data/pdfs/C2/bai3.pdf" },
      { id: 204, name: "Bài 4", url: "/data/pdfs/C2/bai4.pdf" },
      { id: 205, name: "Bài 5", url: "/data/pdfs/C2/bai5.pdf" },
      { id: 206, name: "Bài 6", url: "/data/pdfs/C2/bai6.pdf" },
    ],
  },
  {
    id: 3,
    title: "Chương 3",
    files: [
      { id: 301, name: "Bài 1", url: "/data/pdfs/C3/bai1.pdf" },
      { id: 302, name: "Bài 2", url: "/data/pdfs/C3/bai2.pdf" },
      { id: 303, name: "Bài 3", url: "/data/pdfs/C3/bai3.pdf" },
      { id: 304, name: "Bài 4", url: "/data/pdfs/C3/bai4.pdf" },
    ],
  },
];

const SUGGESTIONS = [
  { text: "Hướng dẫn sử dụng các hàm điều kiện và hàm tìm kiếm trong Excel",         icon: assets.compass_icon },
  { text: "Tóm tắt kiến thức trọng tâm về cấu trúc máy tính và hệ điều hành",         icon: assets.bulb_icon },
  { text: "Tổng hợp các phím tắt và thủ thuật thao tác nhanh trên Windows và Word",   icon: assets.message_icon },
  { text: "Viết đoạn mã mẫu và giải thích logic thuật toán bằng Python và C++",        icon: assets.code_icon },
];

// ─── Sub-components ────────────────────────────────────────────────────────────

function WelcomeScreen({ onSuggest }) {
  return (
    <div className="welcome">
      <div className="welcome-badge">✦ AI Trợ lý học tập</div>
      <h1>Xin chào! Tôi là <span className="gradient-text">HCA</span></h1>
      <p className="welcome-sub">
        Trợ lý học tập môn Tin học — hỏi bất cứ điều gì về bài giảng, bài tập hay lý thuyết.
      </p>
      <div className="suggestions">
        {SUGGESTIONS.map((s, i) => (
          <div key={i} className="suggestion-card" onClick={() => onSuggest(s.text)}>
            <p>{s.text}</p>
            <img src={s.icon} alt="" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatMessage({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`msg ${isUser ? "user-msg" : "bot-msg"}`}>
      {isUser ? (
        <>
          <img src={assets.user_icon} alt="user" className="msg-avatar" />
          <div className="msg-bubble user-bubble">{msg.text}</div>
        </>
      ) : (
        <>
          <div className="bot-icon">AI</div>
          <div className="msg-bubble bot-bubble">
            <ReactMarkdown>{msg.text}</ReactMarkdown>
          </div>
        </>
      )}
    </div>
  );
}

function StreamingMessage({ text, isLoading }) {
  return (
    <div className="msg bot-msg">
      <div className="bot-icon">AI</div>
      <div className="msg-bubble bot-bubble">
        {isLoading && !text ? (
          <div className="typing-indicator"><span /><span /><span /></div>
        ) : (
          <ReactMarkdown>{text}</ReactMarkdown>
        )}
      </div>
    </div>
  );
}

function InputBar({ input, onChange, onSend, onStop, onKeyDown, isStreaming }) {
  return (
    <div className="input-area">
      <div className="input-box">
        <textarea
          rows={1}
          className="chat-input"
          placeholder="Nhập câu hỏi về môn Tin học..."
          value={input}
          onChange={onChange}
          onKeyDown={onKeyDown}
        />
        {isStreaming ? (
          <button className="stop-btn" onClick={onStop} title="Dừng">
            <span className="stop-icon" />
          </button>
        ) : (
          <button
            className={`send-btn ${input.trim() ? "active" : ""}`}
            onClick={onSend}
            disabled={!input.trim()}
          >
            <img src={assets.send_icon} alt="send" />
          </button>
        )}
      </div>
      <p className="input-hint">HCA có thể mắc sai sót. Vui lòng xác minh thông tin quan trọng.</p>
    </div>
  );
}

function DocumentsView() {
  const [selectedFile, setSelectedFile] = useState(null);
  return (
    <div className="docs-view">
      <div className="docs-sidebar">
        <h3>Môn học</h3>
        {DOCUMENT_DATA.map((chapter) => (
          <div key={chapter.id} className="chapter-group">
            <p className="chapter-name">📂 {chapter.title}</p>
            {chapter.files.map((file) => (
              <div
                key={file.id}
                className={`doc-item ${selectedFile?.id === file.id ? "doc-item-active" : ""}`}
                onClick={() => setSelectedFile(file)}
              >
                📄 {file.name}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="docs-content">
        {selectedFile ? (
          <>
            <div className="docs-header">
              <span>📄 {selectedFile.name}</span>
              <button className="close-btn" onClick={() => setSelectedFile(null)}>✕ Đóng</button>
            </div>
            <iframe src={selectedFile.url} title={selectedFile.name} className="pdf-frame" />
          </>
        ) : (
          <div className="docs-empty">
            <div className="docs-empty-inner">
              <div className="docs-empty-icon">📖</div>
              <p>Chọn một tài liệu để bắt đầu</p>
              <span>Chọn tài liệu từ danh sách bên trái để xem nội dung.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

const Main = () => {
  const { onSent, setInput, input, messages, streamingText, loading, stopChat } = useContext(Context);
  const messagesRef = useRef(null);
  const location = useLocation();

  const isDocsMode    = location.pathname.includes("/documents");
  const isStreaming   = loading || !!streamingText;
  const hasMessages   = messages.length > 0 || isStreaming;

  // Auto-scroll khi có tin nhắn mới
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, streamingText]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSent(input);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="main">
      {/* Topbar */}
      <div className="topbar">
        <span className="topbar-title">
          {isDocsMode ? "📚 Tài liệu học tập" : <><span className="brand-dot" />HCA Chatbot</>}
        </span>
        <div className="topbar-right">
          <a href="/home.html" className="topbar-back-btn">← Trang chủ</a>
          <img src={assets.user_icon} alt="user" className="avatar" />
        </div>
      </div>

      {/* Chat view */}
      {!isDocsMode && (
        <div className="chat-view">
          <div className="messages" ref={messagesRef}>
            {!hasMessages ? (
              <WelcomeScreen onSuggest={onSent} />
            ) : (
              <div className="conversation">
                {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}
                {isStreaming && <StreamingMessage text={streamingText} isLoading={loading} />}
              </div>
            )}
          </div>

          <InputBar
            input={input}
            onChange={(e) => setInput(e.target.value)}
            onSend={handleSend}
            onStop={stopChat}
            onKeyDown={handleKeyDown}
            isStreaming={isStreaming}
          />
        </div>
      )}

      {/* Documents view */}
      {isDocsMode && <DocumentsView />}
    </div>
  );
};

export default Main;