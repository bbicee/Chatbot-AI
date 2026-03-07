import { useState, useRef } from "react";
import runChat, { resetChatHistory, stopChat } from "../config/chatbot";
import { Context } from "./ContextDef";

// ─── Helpers ───────────────────────────────────────────────────────────────────

const STORAGE_KEY = "hca_conversations";

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveToStorage(conversations) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch {
    // Bỏ qua lỗi storage đầy
  }
}

// ─── Context Provider ──────────────────────────────────────────────────────────

const ContextProvider = ({ children }) => {
  const [input, setInput]               = useState("");
  const [messages, setMessages]         = useState([]);
  const [streamingText, setStreamingText] = useState("");
  const [loading, setLoading]           = useState(false);
  const [conversations, setConversations] = useState(loadFromStorage);
  const [activeConvId, setActiveConvId] = useState(null);

  // Dùng ref để đọc activeConvId bên trong async mà không bị stale closure
  const activeConvIdRef = useRef(null);
  // Tăng mỗi khi user chuyển chat → dùng để huỷ kết quả stream cũ
  const streamingSessionRef = useRef(0);

  // ─── Helpers nội bộ ──────────────────────────────────────────────────────────

  function setActiveConv(id) {
    activeConvIdRef.current = id;
    setActiveConvId(id);
  }

  function updateConversations(updater) {
    setConversations((prev) => {
      const updated = updater(prev);
      saveToStorage(updated);
      return updated;
    });
  }

  // ─── Actions ─────────────────────────────────────────────────────────────────

  const newChat = () => {
    stopChat();
    streamingSessionRef.current++;
    resetChatHistory();
    setMessages([]);
    setStreamingText("");
    setLoading(false);
    setInput("");
    setActiveConv(null);
  };

  const loadConversation = (conv) => {
    stopChat();
    streamingSessionRef.current++;
    setActiveConv(conv.id);
    setMessages(conv.messages ?? []);
    setStreamingText("");
    setLoading(false);
  };

  const deleteConversation = (id) => {
    updateConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeConvIdRef.current === id) {
      setActiveConv(null);
      setMessages([]);
      setStreamingText("");
    }
  };

  const onSent = async (prompt) => {
    const currentPrompt = typeof prompt === "string" ? prompt : input;
    if (!currentPrompt || loading) return;

    // Chụp session & conv gốc tại thời điểm bắt đầu gửi
    const sessionId  = streamingSessionRef.current;
    // Nếu conv hiện tại chưa có id → pre-generate ngay để dùng trong finally
    const originConvId = activeConvIdRef.current ?? Date.now().toString();
    const isNewConv    = activeConvIdRef.current === null;

    setInput("");
    setStreamingText("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", text: currentPrompt }]);

    let botReply = "";

    try {
      let isFirstChunk = true;
      for await (const chunk of runChat(currentPrompt)) {
        // User đã chuyển sang chat khác → dừng ngay, không update UI
        if (streamingSessionRef.current !== sessionId) break;
        if (isFirstChunk) { setLoading(false); isFirstChunk = false; }
        botReply += chunk;
        setStreamingText(botReply);
      }
    } catch (err) {
      console.error("Lỗi trong onSent:", err);
      botReply = "Lỗi kết nối. Vui lòng thử lại.";
      setLoading(false);
    } finally {
      const botMessage = { role: "bot", text: botReply };
      const userNavigatedAway = streamingSessionRef.current !== sessionId;

      if (!userNavigatedAway) {
        // User vẫn ở đây → update UI bình thường
        setMessages((prev) => [...prev, botMessage]);
        setStreamingText("");
      }

      // Luôn lưu vào conversation gốc dù user đã đi hay chưa
      if (isNewConv) {
        if (!userNavigatedAway) setActiveConv(originConvId);
        updateConversations((prev) => [{
          id: originConvId,
          prompt: currentPrompt,
          messages: [{ role: "user", text: currentPrompt }, botMessage],
        }, ...prev]);
      } else {
        updateConversations((prev) =>
          prev.map((c) =>
            c.id === originConvId
              ? { ...c, messages: [...(c.messages ?? []), { role: "user", text: currentPrompt }, botMessage] }
              : c
          )
        );
      }
    }
  };

  // ─── Context value ────────────────────────────────────────────────────────────

  return (
    <Context.Provider value={{
      input, setInput,
      messages, streamingText, loading,
      conversations, activeConvId,
      onSent, newChat, loadConversation, deleteConversation,
      stopChat,
    }}>
      {children}
    </Context.Provider>
  );
};

export default ContextProvider;