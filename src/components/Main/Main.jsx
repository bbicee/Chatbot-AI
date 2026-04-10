import React, { useContext, useRef, useEffect, useState, useCallback } from "react";
import "./Main.css";
import { assets } from "../../assets/assets";
import { Context } from "../../context/ContextDef";
import ReactMarkdown from "react-markdown";
import { useLocation } from "react-router-dom";
import axios from "axios";
import {
  getOrCreateAnonymousUserId,
  getMessages,
  listFileConversations,
  createFileConversation,
  deleteConversation as deleteConversationApi,
  streamFileChat,
  streamFileQuiz,
  updateConversationTitle,
} from "../../config/chatApi";

const apiUrl = import.meta.env.VITE_API_URL;

const SUGGESTIONS_CHAT = [
  { text: "Hướng dẫn cách sử dụng Excel để tổng hợp và phân tích dữ liệu",  icon: assets.compass_icon },
  { text: "Giải thích các khái niệm cơ bản về thuật toán và độ phức tạp",   icon: assets.bulb_icon },
  { text: "Thảo luận về cơ sở dữ liệu quan hệ và cách viết câu lệnh SQL",  icon: assets.message_icon },
  { text: "Viết mã mẫu Python để giải quyết bài toán sắp xếp",              icon: assets.code_icon },
];

const SUGGESTIONS_QUIZ = [
  { text: "Tạo 20 câu trắc nghiệm về cơ sở dữ liệu SQL",                   icon: assets.compass_icon },
  { text: "Tạo 10 câu hỏi về thuật toán và cấu trúc dữ liệu",              icon: assets.bulb_icon },
  { text: "Tạo 15 câu trắc nghiệm về lập trình Python cơ bản",             icon: assets.message_icon },
  { text: "Tạo 20 câu hỏi về mạng máy tính và giao thức TCP/IP",           icon: assets.code_icon },
];



function WelcomeScreen({ onSuggest, suggestions }) {
  return (
    <div className="welcome">
      <div className="welcome-badge">✦ AI Trợ lý học tập</div>
      <h1>Xin chào! Tôi là <span className="gradient-text">HCA</span></h1>
      <p className="welcome-sub">
        Trợ lý học tập môn Tin học — hỏi bất cứ điều gì về bài giảng, bài tập hay lý thuyết.
      </p>
      <div className="suggestions">
        {suggestions.map((s, i) => (
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

function FileChatPanel({ file, mode, onClose }) {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [streamingText, setStreamingText] = useState('');
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [initializing, setInitializing] = useState(true);
  const messagesRef = useRef(null);
  const abortRef = useRef(null);
  const anonIdRef = useRef(getOrCreateAnonymousUserId());
  const anonId = anonIdRef.current;

  // Load conversation list for this file+mode
  const fetchConversations = useCallback(async () => {
    try {
      const list = await listFileConversations(file.id, anonId, mode);
      setConversations(list);
      return list;
    } catch (err) {
      console.error('[FileChatPanel] fetchConversations error:', err);
      return [];
    }
  }, [file.id, mode, anonId]);

  // Load messages for a given conversation
  const loadConversation = useCallback(async (convId) => {
    setActiveConvId(convId);
    setMessages([]);
    setStreamingText('');
    try {
      const msgs = await getMessages(convId);
      setMessages(msgs.map((m) => ({ role: m.role, text: m.content })));
    } catch (err) {
      console.error('[FileChatPanel] loadConversation error:', err);
    }
  }, []);

  // Initial load: fetch list, auto-open most recent or create new
  useEffect(() => {
    let cancelled = false;
    async function init() {
      setInitializing(true);
      setMessages([]);
      setStreamingText('');
      setInput('');
      setActiveConvId(null);
      const list = await fetchConversations();
      if (cancelled) return;
      if (list.length > 0) {
        await loadConversation(list[0].id);
      }
      setInitializing(false);
    }
    init();
    return () => { cancelled = true; };
  }, [file.id, mode]);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, streamingText]);

  const handleNewConversation = () => {
    setActiveConvId(null);
    setMessages([]);
    setStreamingText('');
    setInput('');
  };

  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation();
    try {
      await deleteConversationApi(convId);
      const remaining = conversations.filter((c) => c.id !== convId);
      setConversations(remaining);
      if (convId === activeConvId) {
        if (remaining.length > 0) loadConversation(remaining[0].id);
        else { setActiveConvId(null); setMessages([]); }
      }
    } catch (err) {
      console.error('[FileChatPanel] deleteConversation error:', err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    let convId = activeConvId;
    // If no active conversation, create one first
    if (!convId) {
      try {
        const conv = await createFileConversation(file.id, anonId, mode);
        setConversations((prev) => [conv, ...prev]);
        setActiveConvId(conv.id);
        convId = conv.id;
      } catch (err) {
        console.error('[FileChatPanel] auto-create conversation error:', err);
        return;
      }
    }

    const msg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: msg }]);
    setLoading(true);
    setStreamingText('');
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      let fullText = '';
      const streamFn = mode === 'quiz' ? streamFileQuiz : streamFileChat;
      for await (const chunk of streamFn(convId, file.id, msg, controller.signal)) {
        fullText += chunk;
        setStreamingText(fullText);
      }
      if (fullText.trim()) {
        setMessages((prev) => [...prev, { role: 'assistant', text: fullText }]);
        // Persist title to DB on first message (outside updater to avoid double-call in StrictMode)
        const isDefaultTitle = (t) => t === 'Chat mới' || t === 'Trắc nghiệm mới';
        const convInList = conversations.find((c) => c.id === convId);
        if (convInList && isDefaultTitle(convInList.title)) {
          const newTitle = msg.slice(0, 40);
          updateConversationTitle(convId, newTitle, anonId).catch(() => {});
          setConversations((prev) => prev.map((c) =>
            c.id === convId ? { ...c, title: newTitle } : c
          ));
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setMessages((prev) => [...prev, { role: 'assistant', text: '⚠️ Hệ thống đang gặp sự cố, vui lòng thử lại sau.', isError: true }]);
      }
    } finally {
      setLoading(false);
      setStreamingText('');
      abortRef.current = null;
    }
  };

  const handleStop = () => abortRef.current?.abort();
  const isStreaming = loading || !!streamingText;

  return (
    <div className="file-chat-panel">
      {/* Header */}
      <div className="file-chat-header">
        <div className="file-chat-header-left">
          <span className={`file-chat-mode-badge ${mode === 'quiz' ? 'quiz' : 'chat'}`}>
            {mode === 'quiz' ? <><i className="fas fa-bullseye" /> Trắc nghiệm</> : <><i className="fas fa-comment" /> Chat AI</>}
          </span>
          <span className="file-chat-filename" title={file.file_name}>{file.file_name}</span>
        </div>
        <button className="file-chat-close" onClick={onClose} title="Đóng">✕</button>
      </div>

      <div className="file-chat-body">
        {/* History sidebar */}
        <div className="file-chat-history">
          <button className={`file-chat-new-btn ${mode === 'quiz' ? 'quiz' : ''}`} onClick={handleNewConversation}>
            <i className="fas fa-plus" /> Mới
          </button>
          <div className="file-chat-history-list">
            {initializing ? (
              <p className="file-chat-history-hint">Đang tải...</p>
            ) : conversations.length === 0 ? (
              <p className="file-chat-history-hint">Chưa có lịch sử</p>
            ) : conversations.map((conv) => (
              <div
                key={conv.id}
                className={`file-chat-history-item ${conv.id === activeConvId ? 'active' : ''} ${mode === 'quiz' ? 'quiz' : ''}`}
                onClick={() => loadConversation(conv.id)}
                title={conv.title}
              >
                <span className="file-chat-history-icon">
                  {mode === 'quiz' ? <i className="fas fa-bullseye" /> : <i className="fas fa-comment" />}
                </span>
                <span className="file-chat-history-title">
                  {(conv.title || 'Cuộc trò chuyện').slice(0, 22)}{(conv.title || '').length > 22 ? '…' : ''}
                </span>
                <button
                  className="file-chat-history-del"
                  onClick={(e) => handleDeleteConversation(e, conv.id)}
                  title="Xóa"
                >
                  <i className="fas fa-times" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="file-chat-main">
          <div className="file-chat-messages" ref={messagesRef}>
            {initializing ? (
              <div className="file-chat-loading">
                <div className="typing-indicator"><span /><span /><span /></div>
              </div>
            ) : !activeConvId ? (
              <div className="file-chat-welcome">
                <div className="file-chat-welcome-icon">
                  {mode === 'quiz'
                    ? <i className="fas fa-bullseye" style={{ color: '#e65100', fontSize: 38 }} />
                    : <i className="fas fa-comment" style={{ color: '#2777fc', fontSize: 38 }} />}
                </div>
                <p>{mode === 'quiz' ? 'Tạo câu hỏi trắc nghiệm từ tài liệu này' : 'Hỏi AI về nội dung tài liệu này'}</p>
                <span>{mode === 'quiz'
                  ? `AI sẽ tạo câu hỏi dựa trên nội dung của "${file.file_name}". Ví dụ: "Tạo 10 câu hỏi về chương này"`
                  : `AI sẽ trả lời dựa trên nội dung của "${file.file_name}". Ví dụ: "Tóm tắt nội dung chính của tài liệu"`
                }</span>
              </div>
            ) : (
              <div className="file-chat-conversation">
                {messages.map((msg, i) => <ChatMessage key={i} msg={msg} />)}
                {isStreaming && <StreamingMessage text={streamingText} isLoading={loading} />}
              </div>
            )}
          </div>

          <InputBar
            input={input}
            onChange={(e) => setInput(e.target.value)}
            onSend={handleSend}
            onStop={handleStop}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            isStreaming={isStreaming}
            isQuizMode={mode === 'quiz'}
          />
        </div>
      </div>
    </div>
  );
}

function DocumentsView() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeSideMode, setActiveSideMode] = useState(null); // 'chat' | 'quiz' | null
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openSubjects, setOpenSubjects] = useState(new Set());
  const [openChapters, setOpenChapters] = useState(new Set());

  useEffect(() => {
    async function fetchData() {
      try {
        const [{ data: subjectsData }, { data: chaptersData }, { data: filesData }] = await Promise.all([
          axios.get(`${apiUrl}/subjects`),
          axios.get(`${apiUrl}/chapters`),
          axios.get(`${apiUrl}/files`),
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
          <span><i className="fas fa-book-open" /> Tài liệu học tập</span>
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
              <span><i className="fas fa-book" /></span>
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
                  <span><i className="fas fa-folder-open" /></span>
                  <span className="docs-label">{chapter.name}</span>
                  <span className="docs-badge">{chapter.files.length}</span>
                </div>

                {openChapters.has(chapter.id) && chapter.files.map((file) => (
                  <div
                    key={file.id}
                    className={`doc-item ${selectedFile?.id === file.id ? "doc-item-active" : ""}`}
                    onClick={() => { setSelectedFile(file); setActiveSideMode(null); }}
                  >
                    <span><i className="fas fa-file" /></span>
                    <span className="docs-file-name">
                      {file.file_name?.includes('.') ? file.file_name : `${file.file_name}.${(file.file_type || '').split('/').pop().replace('vnd.openxmlformats-officedocument.wordprocessingml.document', 'docx').toLowerCase()}`}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className={`docs-main ${activeSideMode ? "with-panel" : ""}`}>
        <div className="docs-content">
        {selectedFile ? (
          <>
            <div className="docs-header">
              <span><i className="fas fa-file" /> {selectedFile.file_name}</span>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <button
                  className={`file-ai-btn ${activeSideMode === 'chat' ? 'active' : ''}`}
                  onClick={() => setActiveSideMode(activeSideMode === 'chat' ? null : 'chat')}
                >
                  <i className="fas fa-comment" /> Chat AI
                </button>
                <button
                  className={`file-ai-btn quiz ${activeSideMode === 'quiz' ? 'active' : ''}`}
                  onClick={() => setActiveSideMode(activeSideMode === 'quiz' ? null : 'quiz')}
                >
                  <i className="fas fa-bullseye" style={{ color: '#e65100' }}/> Trắc nghiệm
                </button>
                <a
                  href={selectedFile.file_url}
                  target="_blank"
                  rel="noreferrer"
                  className="docs-open-btn"
                >
                  Mở tab mới
                </a>
                <button className="close-btn" onClick={() => { setSelectedFile(null); setActiveSideMode(null); }}>Đóng</button>
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
              <div className="docs-empty-icon"><i className="fas fa-book-open" /></div>
              <p>Chọn một tài liệu để xem</p>
              <span>Mở rộng môn học và chương từ danh sách bên trái, sau đó nhấn vào tài liệu để xem nội dung.</span>
              <span style={{ display: 'block', marginTop: 10, color: '#2777fc', fontSize: 12 }}>
                <i className="fas fa-comment" /> Chat AI &amp; <i className="fas fa-bullseye" /> Trắc nghiệm sẽ xuất hiện khi bạn chọn tài liệu.
              </span>
            </div>
          </div>
        )}
        </div>

        {selectedFile && activeSideMode && (
          <FileChatPanel
            file={selectedFile}
            mode={activeSideMode}
            onClose={() => setActiveSideMode(null)}
          />
        )}
      </div>
    </div>
  );
}



const Main = () => {
  const { onSent, onGenerateQuiz, setInput, input, messages, streamingText, loading, stopChat, isQuizMode } = useContext(Context);
  const messagesRef = useRef(null);
  const location = useLocation();

  const isDocsMode    = location.pathname.includes("/documents");
  const isStreaming   = loading || !!streamingText;
  const hasMessages   = messages.length > 0 || isStreaming;

  
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
      <div className="topbar">
        <span className="topbar-title">
          {isDocsMode ? <><i className="fas fa-book" /> Tài liệu học tập</> : <><span className="brand-dot" />HCA Chatbot</>}
        </span>
        <div className="topbar-right">
          <a href="/admin" className="topbar-admin-btn"><i className="fas fa-user-cog" /> Quản lý</a>
          <a href="/home.html" className="topbar-back-btn">Trang chủ</a>
          <img src={assets.user_icon} alt="user" className="avatar" />
        </div>
      </div>

      {!isDocsMode && (
        <div className="chat-view">
          {isQuizMode && (
            <div className="quiz-info-banner">
              <span className="quiz-info-icon"><i className="fas fa-bullseye" /></span>
              <span>
                <strong>Chế độ Tạo Trắc nghiệm</strong> — Hệ thống chỉ hỗ trợ tạo câu hỏi trắc nghiệm về các chủ đề học thuật.
                Mặc định <strong>20 câu hỏi</strong> — thay đổi bằng cách gõ số câu vào yêu cầu (ví dụ: “Tạo 10 câu về SQL”).
              </span>
            </div>
          )}
          <div className="messages" ref={messagesRef}>
            {!hasMessages ? (
              <WelcomeScreen
                onSuggest={(text) => isQuizMode ? onGenerateQuiz(text) : onSent(text)}
                suggestions={isQuizMode ? SUGGESTIONS_QUIZ : SUGGESTIONS_CHAT}
              />
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

      {isDocsMode && <DocumentsView />}
    </div>
  );
};

export default Main;