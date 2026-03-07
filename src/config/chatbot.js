import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import precomputedData from "../embeddings.json";

// ─── Config ────────────────────────────────────────────────────────────────────

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const IS_MOCK = import.meta.env.VITE_MOCK_MODE === "true";
const MAX_HISTORY = 6; // số tin nhắn tối đa giữ lại (tính theo cặp user+model)

const SYSTEM_INSTRUCTION = `Bạn là trợ lý học tập môn Tin học hỗ trợ sinh viên.
Quy tắc xử lý:
1. Đọc [Ngữ cảnh từ tài liệu] được đính kèm trong câu hỏi.
2. Kiểm tra xem câu hỏi của sinh viên có liên quan đến các chủ đề trong ngữ cảnh hoặc môn Tin học nói chung hay không.
3. Nếu ĐÚNG chủ đề: Trả lời sinh viên trực tiếp, xưng hô lịch sự, tự nhiên. Sử dụng kiến thức của bạn để giải thích chi tiết.
4. Nếu SAI chủ đề (ví dụ: hỏi về thời tiết, giải trí, toán học khác...): Từ chối lịch sự và nhắc nhở rằng bạn chỉ hỗ trợ giải đáp môn Tin học.
5. Tuyệt đối KHÔNG tự tạo ra các đoạn hội thoại mẫu (kiểu "Học sinh: ... / Chuyên gia: ..."). Chỉ trả lời thẳng vào vấn đề.`;

// ─── Khởi tạo model & embeddings ───────────────────────────────────────────────

const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  systemInstruction: SYSTEM_INSTRUCTION,
});

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: API_KEY,
  model: "gemini-embedding-001",
});

// ─── Vector store (lazy init) ──────────────────────────────────────────────────

let vectorStore = null;

async function getVectorStore() {
  if (vectorStore) return vectorStore;

  const store = new MemoryVectorStore(embeddings);
  const vectors = precomputedData.chunks.map((c) => c.vector);
  const docs = precomputedData.chunks.map(
    (c) => new Document({ pageContent: c.text, metadata: c.metadata })
  );

  await store.addVectors(vectors, docs);
  vectorStore = store;
  return vectorStore;
}

// ─── Chat history ──────────────────────────────────────────────────────────────

let chatHistory = [];

export const resetChatHistory = () => {
  chatHistory = [];
};

function appendToHistory(userPrompt, botReply) {
  chatHistory.push({ role: "user",  parts: [{ text: userPrompt }] });
  chatHistory.push({ role: "model", parts: [{ text: botReply }] });
  if (chatHistory.length > MAX_HISTORY) {
    chatHistory = chatHistory.slice(-MAX_HISTORY);
  }
}

// ─── Stop control ──────────────────────────────────────────────────────────────

let stopRequested = false;
export const stopChat = () => { stopRequested = true; };

// ─── Mock mode (dùng khi VITE_MOCK_MODE=true) ──────────────────────────────────

const MOCK_RESPONSES = [
  (prompt) => `Đây là phản hồi giả cho câu hỏi: "${prompt}"\n\nĐây là chế độ **mock** để test giao diện, không gọi API thật.`,
  (prompt) => `Mock response: Bạn đã hỏi về "${prompt}". Trong chế độ thật, chatbot sẽ tìm kiếm tài liệu và trả lời chi tiết hơn.`,
  (prompt) => `[MOCK] Câu trả lời mẫu cho: "${prompt}"\n\n- Điểm 1: Lorem ipsum\n- Điểm 2: Dolor sit amet\n- Điểm 3: Consectetur adipiscing`,
];

async function* mockChat(prompt) {
  const randomResponse = MOCK_RESPONSES[Math.floor(Math.random() * MOCK_RESPONSES.length)];
  for (const char of randomResponse(prompt)) {
    if (stopRequested) { stopRequested = false; return; }
    yield char;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

// ─── Main chat function ────────────────────────────────────────────────────────

async function* runChat(prompt) {
  stopRequested = false;

  if (IS_MOCK) { yield* mockChat(prompt); return; }
  if (!API_KEY) { yield "Thiếu API Key!"; return; }

  try {
    const store = await getVectorStore();
    const results = await store.similaritySearch(prompt, 3);
    const context = results.map((r) => r.pageContent).join("\n\n");

    const chat = model.startChat({ history: chatHistory });
    const fullPrompt = `[Ngữ cảnh từ tài liệu]:\n${context}\n\n[Câu hỏi của sinh viên]: ${prompt}`;
    const { stream } = await chat.sendMessageStream(fullPrompt);

    let fullReply = "";
    for await (const chunk of stream) {
      if (stopRequested) { stopRequested = false; return; }
      const text = chunk.text();
      fullReply += text;
      yield text;
    }

    appendToHistory(prompt, fullReply);
  } catch (error) {
    console.error("Lỗi tại runChat:", error);
    yield "Có lỗi xảy ra trong quá trình xử lý, vui lòng thử lại.";
  }
}

export default runChat;