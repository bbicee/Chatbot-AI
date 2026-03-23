const apiUrl = import.meta.env.VITE_API_URL;

function generateUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function getOrCreateAnonymousUserId() {
  const STORAGE_KEY = 'anonymousUserId';
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id || id.trim() === '') {
    id = generateUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

export async function createConversation(anonymousUserId, type = 'chat') {
  const res = await fetch(`${apiUrl}/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ anonymous_user_id: anonymousUserId, type }),
  });
  if (!res.ok) throw new Error(`createConversation: ${res.status}`);
  return res.json();
}

export async function listConversations(anonymousUserId) {
  const url = anonymousUserId
    ? `${apiUrl}/conversations?anonymous_user_id=${encodeURIComponent(anonymousUserId)}`
    : `${apiUrl}/conversations`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`listConversations: ${res.status}`);
  return res.json();
}

export async function getMessages(conversationId) {
  const res = await fetch(`${apiUrl}/conversations/${conversationId}/messages`);
  if (!res.ok) throw new Error(`getMessages: ${res.status}`);
  return res.json();
}

export async function updateConversationTitle(conversationId, title) {
  const res = await fetch(`${apiUrl}/conversations/${conversationId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(`updateConversationTitle: ${res.status}`);
  return res.json();
}

export async function deleteConversation(conversationId) {
  const res = await fetch(`${apiUrl}/conversations/${conversationId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`deleteConversation: ${res.status}`);
}



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



export async function* streamChat(conversationId, message, signal) {
  const res = await fetch(`${apiUrl}/chat`, {
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



export async function* streamQuiz(conversationId, message, signal) {
  const res = await fetch(`${apiUrl}/chat/quiz`, {
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
