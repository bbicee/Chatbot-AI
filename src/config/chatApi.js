const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function createConversation(userId, type = 'chat') {
  const res = await fetch(`${API_BASE}/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, type }),
  });
  if (!res.ok) throw new Error(`createConversation: ${res.status}`);
  return res.json();
}

export async function listConversations(userId) {
  const url = userId
    ? `${API_BASE}/conversations?user_id=${userId}`
    : `${API_BASE}/conversations`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`listConversations: ${res.status}`);
  return res.json();
}

export async function getMessages(conversationId) {
  const res = await fetch(`${API_BASE}/conversations/${conversationId}/messages`);
  if (!res.ok) throw new Error(`getMessages: ${res.status}`);
  return res.json();
}

export async function updateConversationTitle(conversationId, title) {
  const res = await fetch(`${API_BASE}/conversations/${conversationId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(`updateConversationTitle: ${res.status}`);
  return res.json();
}

export async function deleteConversation(conversationId) {
  const res = await fetch(`${API_BASE}/conversations/${conversationId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`deleteConversation: ${res.status}`);
}

// ─── SSE stream reader ────────────────────────────────────────────────────────

async function* readSSEStream(body, signal) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      if (signal?.aborted) return;
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (payload === '[DONE]') return;
        try {
          const parsed = JSON.parse(payload);
          if (parsed.error) throw new Error(parsed.error);
          if (parsed.text) yield parsed.text;
        } catch (e) {
          if (e.message && !e.message.startsWith('{')) throw e;
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ─── Chat streaming ───────────────────────────────────────────────────────────

export async function* streamChat(conversationId, message, signal) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId, message }),
    signal,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  yield* readSSEStream(res.body, signal);
}

// ─── Quiz streaming ───────────────────────────────────────────────────────────

export async function* streamQuiz(conversationId, message, signal) {
  const res = await fetch(`${API_BASE}/chat/quiz`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ conversationId, message }),
    signal,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  yield* readSSEStream(res.body, signal);
}
