import { useState, useRef, useEffect, useCallback } from "react";
import {
  createConversation,
  listConversations,
  getMessages,
  deleteConversation as apiDeleteConversation,
  updateConversationTitle,
  streamChat,
  streamQuiz,
  getOrCreateAnonymousUserId,
} from "../config/chatApi";
import { Context } from "./ContextDef";

const ContextProvider = ({ children }) => {
  const [input, setInput]                 = useState("");
  const [messages, setMessages]           = useState([]);
  const [streamingText, setStreamingText] = useState("");
  const [loading, setLoading]             = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId]   = useState(null);
  const [isQuizMode, setIsQuizMode]       = useState(false);

  const activeConvIdRef    = useRef(null);
  const streamingSessionRef = useRef(0);
  const abortControllerRef  = useRef(null);

  function setActiveConv(id) {
    activeConvIdRef.current = id;
    setActiveConvId(id);
  }

  const loadConversations = useCallback(async () => {
    try {
      const anonId = getOrCreateAnonymousUserId();
      const data = await listConversations(anonId);
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("[conversations] load failed:", err.message);
    }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  const newChat = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    streamingSessionRef.current++;
    setMessages([]);
    setStreamingText("");
    setLoading(false);
    setInput("");
    setActiveConv(null);
    setIsQuizMode(false);
  };

  const newQuizChat = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    streamingSessionRef.current++;
    setMessages([]);
    setStreamingText("");
    setLoading(false);
    setInput("");
    setActiveConv(null);
    setIsQuizMode(true);
  };

  const loadConversation = async (conv) => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    streamingSessionRef.current++;
    setActiveConv(conv.id);
    setStreamingText("");
    setLoading(false);
    setIsQuizMode(conv.type === "quiz");
    try {
      const msgs = await getMessages(conv.id);
      setMessages(msgs.map((m) => ({ role: m.role === "assistant" ? "bot" : "user", text: m.content })));
    } catch {
      setMessages([]);
    }
  };

  const deleteConversation = async (id) => {
    try {
      await apiDeleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConvIdRef.current === id) {
        setActiveConv(null);
        setMessages([]);
        setStreamingText("");
      }
    } catch (err) {
      console.error("[conversations] delete failed:", err.message);
    }
  };

  const stopChat = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
  };

  const onGenerateQuiz = async (prompt) => {
    const currentPrompt = typeof prompt === "string" ? prompt : input;
    if (!currentPrompt || loading) return;

    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const sessionId  = ++streamingSessionRef.current;
    let convId       = activeConvIdRef.current;
    const isNewConv  = convId === null;

    if (isNewConv) {
      try {
        const anonId = getOrCreateAnonymousUserId();
        const conv  = await createConversation(anonId, 'quiz');
        convId      = conv.id;
        const title = `[Quiz] ${currentPrompt.slice(0, 50)}`;
        setActiveConv(convId);
        setConversations((prev) => [{ id: convId, title, type: 'quiz', created_at: conv.created_at, updated_at: conv.updated_at }, ...prev]);
        updateConversationTitle(convId, title).catch(() => {});
      } catch (err) {
        console.error("[quiz] create conversation failed:", err.message);
        return;
      }
    }

    setInput("");
    setStreamingText("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", text: currentPrompt }]);

    let botReply = "";
    let isError = false;
    try {
      let isFirstChunk = true;
      for await (const chunk of streamQuiz(convId, currentPrompt, controller.signal)) {
        if (streamingSessionRef.current !== sessionId) break;
        if (isFirstChunk) { setLoading(false); isFirstChunk = false; }
        botReply += chunk;
        setStreamingText(botReply);
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("[quiz] streaming error:", err.message);
        botReply = botReply || "⚠️ Hệ thống đang gặp sự cố, vui lòng thử lại sau.";
        isError = true;
      }
      setLoading(false);
    } finally {
      if (streamingSessionRef.current === sessionId) {
        setMessages((prev) => [...prev, { role: "bot", text: botReply, isError }]);
        setStreamingText("");
        setLoading(false);
        setConversations((prev) =>
          prev.map((c) => c.id === convId ? { ...c, updated_at: new Date().toISOString() } : c)
        );
      }
    }
  };

  const onSent = async (prompt) => {
    const currentPrompt = typeof prompt === "string" ? prompt : input;
    if (!currentPrompt || loading) return;

    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const sessionId  = ++streamingSessionRef.current;
    let convId       = activeConvIdRef.current;
    const isNewConv  = convId === null;

    if (isNewConv) {
      try {
        const anonId = getOrCreateAnonymousUserId();
        const conv  = await createConversation(anonId);
        convId      = conv.id;
        const title = currentPrompt.slice(0, 60);
        setActiveConv(convId);
        setConversations((prev) => [{ id: convId, title, created_at: conv.created_at, updated_at: conv.updated_at }, ...prev]);
        updateConversationTitle(convId, title).catch(() => {});
      } catch (err) {
        console.error("[conversations] create failed:", err.message);
        return;
      }
    }

    setInput("");
    setStreamingText("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", text: currentPrompt }]);

    let botReply = "";
    let isError = false;
    try {
      let isFirstChunk = true;
      for await (const chunk of streamChat(convId, currentPrompt, controller.signal)) {
        if (streamingSessionRef.current !== sessionId) break;
        if (isFirstChunk) { setLoading(false); isFirstChunk = false; }
        botReply += chunk;
        setStreamingText(botReply);
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("[chat] streaming error:", err.message);
        botReply = botReply || "⚠️ Hệ thống đang gặp sự cố, vui lòng thử lại sau.";
        isError = true;
      }
      setLoading(false);
    } finally {
      if (streamingSessionRef.current === sessionId) {
        setMessages((prev) => [...prev, { role: "bot", text: botReply, isError }]);
        setStreamingText("");
        setLoading(false);
        setConversations((prev) =>
          prev.map((c) => c.id === convId ? { ...c, updated_at: new Date().toISOString() } : c)
        );
      }
    }
  };

  return (
    <Context.Provider value={{
    input, setInput,
      messages, streamingText, loading,
      conversations, activeConvId,
      isQuizMode, setIsQuizMode,
      onSent, onGenerateQuiz, newChat, newQuizChat, loadConversation, deleteConversation, stopChat,
      refreshConversations: loadConversations,
    }}>
      {children}
    </Context.Provider>
  );
};

export default ContextProvider;