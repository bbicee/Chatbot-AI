import React, { useContext, useRef, useEffect, useState } from "react";
import "./Main.css";
import { assets } from "../../assets/assets";
import { Context } from "../../context/ContextDef";
import ReactMarkdown from "react-markdown";
import { useLocation } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const SUGGESTIONS = [
  { text: "Hướng dẫn cách sử dụng Excel để tổng hợp và phân tích dữ liệu",            icon: assets.compass_icon },
  { text: "Giải thích các khái niệm cơ bản về thuật toán và độ phức tạp",            icon: assets.bulb_icon },
  { text: "Thảo luận về cơ sở dữ liệu quan hệ và cách viết câu lệnh SQL",           icon: assets.message_icon },
  { text: "Viết mã mẫu Python hoặc C++ để giải quyết bài toán lập trình",           icon: assets.code_icon },
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
          <div className={`msg-bubble ${msg.isError ? "error-bubble" : "bot-bubble"}`}>
            {msg.isError ? msg.text : <ReactMarkdown>{msg.text}</ReactMarkdown>}
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

function InputBar({ input, onChange, onSend, onStop, onKeyDown, isStreaming, isQuizMode }) {
  const textareaRef = React.useRef(null);

  React.useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }, [input]);

  const handleChange = (e) => {
    onChange(e);
  };

  return (
    <div className="input-area">
      <div className="input-box">
        <textarea
          ref={textareaRef}
          rows={1}
          className="chat-input"
          placeholder={isQuizMode ? "Nhập tên môn học hoặc chủ đề cần tạo câu hỏi..." : "Hỏi bất kỳ điều gì về các môn học..."}
          value={input}
          onChange={handleChange}
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
      <p className="input-hint">
        {isQuizMode
          ? "Chế độ trắc nghiệm: mặc định 20 câu hỏi — gõ số câu vào yêu cầu nếu muốn thay đổi."
          : "HCA có thể mắc sai sót. Vui lòng xác minh thông tin quan trọng."}
      </p>
    </div>
  );
}

function DocumentsView() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openSubjects, setOpenSubjects] = useState(new Set());
  const [openChapters, setOpenChapters] = useState(new Set());

  useEffect(() => {
    async function fetchData() {
      try {
        const [{ data: subjectsData }, { data: chaptersData }, { data: filesData }] = await Promise.all([
          axios.get(`${API_BASE}/subjects`),
          axios.get(`${API_BASE}/chapters`),
          axios.get(`${API_BASE}/files`),
        ]);
        const nested = subjectsData.map((s) => ({
          ...s,
          chapters: chaptersData
            .filter((c) => c.subject_id === s.id)
            .map((c) => ({
              ...c,
              files: filesData.filter((f) => f.chapter_id === c.id),
            })),
        }));
        setSubjects(nested);
        setOpenSubjects(new Set(subjectsData.map((s) => s.id)));
        setOpenChapters(new Set(chaptersData.map((c) => c.id)));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const toggleSubject = (id) =>
    setOpenSubjects((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const toggleChapter = (id) =>
    setOpenChapters((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const totalFiles = subjects.reduce((a, s) => a + s.chapters.reduce((b, c) => b + c.files.length, 0), 0);

  return (
    <div className="docs-view">
      <div className="docs-sidebar">
        <div className="docs-sidebar-heading">
          <span>📖 Tài liệu học tập</span>
          {!loading && <span className="docs-count">{totalFiles} tài liệu</span>}
        </div>

        {loading && <p className="docs-hint">Đang tải...</p>}
        {!loading && subjects.length === 0 && (
          <p className="docs-hint">Chưa có tài liệu nào.</p>
        )}

        {subjects.map((subject) => (
          <div key={subject.id}>
            <div
              className={`docs-subject-header ${openSubjects.has(subject.id) ? "open" : ""}`}
              onClick={() => toggleSubject(subject.id)}
            >
              <span className="docs-arrow">{openSubjects.has(subject.id) ? "▾" : "▸"}</span>
              <span>📚</span>
              <span className="docs-label">{subject.name}</span>
              <span className="docs-badge">{subject.chapters.reduce((a, c) => a + c.files.length, 0)}</span>
            </div>

            {openSubjects.has(subject.id) && subject.chapters.map((chapter) => (
              <div key={chapter.id}>
                <div
                  className={`docs-chapter-header ${openChapters.has(chapter.id) ? "open" : ""}`}
                  onClick={() => toggleChapter(chapter.id)}
                >
                  <span className="docs-arrow">{openChapters.has(chapter.id) ? "▾" : "▸"}</span>
                  <span>📂</span>
                  <span className="docs-label">{chapter.name}</span>
                  <span className="docs-badge">{chapter.files.length}</span>
                </div>

                {openChapters.has(chapter.id) && chapter.files.map((file) => (
                  <div
                    key={file.id}
                    className={`doc-item ${selectedFile?.id === file.id ? "doc-item-active" : ""}`}
                    onClick={() => setSelectedFile(file)}
                  >
                    <span>📄</span>
                    <span className="docs-file-name">{file.file_name}</span>
                    <span className="docs-file-type" data-type={file.file_type?.toUpperCase()}>{file.file_type?.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="docs-content">
        {selectedFile ? (
          <>
            <div className="docs-header">
              <span>📄 {selectedFile.file_name}</span>
              <div style={{ display: "flex", gap: 8 }}>
                <a
                  href={selectedFile.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="docs-open-btn"
                >
                  ↗ Mở tab mới
                </a>
                <button className="close-btn" onClick={() => setSelectedFile(null)}>✕ Đóng</button>
              </div>
            </div>
            <iframe
              src={
                selectedFile.file_type === "docx"
                  ? `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(selectedFile.file_url)}`
                  : selectedFile.file_url
              }
              title={selectedFile.file_name}
              className="pdf-frame"
            />
          </>
        ) : (
          <div className="docs-empty">
            <div className="docs-empty-inner">
              <div className="docs-empty-icon">📖</div>
              <p>Chọn một tài liệu để xem</p>
              <span>Mở rộng môn học và chương từ danh sách bên trái, sau đó nhấn vào tài liệu để xem nội dung.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

const Main = () => {
  const { onSent, onGenerateQuiz, setInput, input, messages, streamingText, loading, stopChat, isQuizMode } = useContext(Context);
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
    if (isQuizMode) onGenerateQuiz(input);
    else onSent(input);
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
          <a href="/admin" className="topbar-admin-btn">👨‍🏫 Quản lý</a>
          <a href="/home.html" className="topbar-back-btn">← Trang chủ</a>
          <img src={assets.user_icon} alt="user" className="avatar" />
        </div>
      </div>

      {/* Chat view */}
      {!isDocsMode && (
        <div className="chat-view">
          {/* Quiz mode info banner */}
          {isQuizMode && (
            <div className="quiz-info-banner">
              <span className="quiz-info-icon">🎯</span>
              <span>
                <strong>Chế độ Tạo Trắc nghiệm</strong> — Hệ thống chỉ hỗ trợ tạo câu hỏi trắc nghiệm về các chủ đề học thuật.
                Mặc định <strong>20 câu hỏi</strong> — thay đổi bằng cách gõ số câu vào yêu cầu (ví dụ: “Tạo 10 câu về SQL”).
              </span>
            </div>
          )}
          <div className="messages" ref={messagesRef}>
            {!hasMessages ? (
              <WelcomeScreen onSuggest={(text) => isQuizMode ? onGenerateQuiz(text) : onSent(text)} />
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
            isQuizMode={isQuizMode}
          />
        </div>
      )}

      {/* Documents view */}
      {isDocsMode && <DocumentsView />}
    </div>
  );
};

export default Main;