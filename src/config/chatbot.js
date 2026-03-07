import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import knowledge from "../knowledge.json";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: API_KEY,
  model: "gemini-embedding-001", 
});

let vectorStoreInstance = null;
let isInitializing = false;

// Khởi tạo mảng lưu trữ lịch sử hội thoại cục bộ
let chatHistory = [];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getVectorStore() {
  if (vectorStoreInstance) return vectorStoreInstance;

  if (isInitializing) {
    while (isInitializing) {
      await sleep(500);
    }
    return vectorStoreInstance;
  }

  isInitializing = true;
  try {
    console.log("--- Bắt đầu khởi tạo Vector Store ---");

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const texts = await splitter.splitText(knowledge.content);
    const store = new MemoryVectorStore(embeddings);

    const BATCH_SIZE = 5; 
    for (let i = 0; i < texts.length; i += BATCH_SIZE) {
      const batchTexts = texts.slice(i, i + BATCH_SIZE);
      const docs = batchTexts.map((text, index) => ({
        pageContent: text,
        metadata: { id: i + index },
      }));

      await store.addDocuments(docs);
      if (i + BATCH_SIZE < texts.length) {
        await sleep(1000); 
      }
    }

    vectorStoreInstance = store;
    console.log("--- Khởi tạo hoàn tất! ---");
    return vectorStoreInstance;
  } catch (error) {
    console.error("Lỗi khởi tạo:", error);
    isInitializing = false;
    throw error;
  } finally {
    isInitializing = false;
  }
}

// Hàm này dùng để xóa lịch sử khi người dùng bấm "New Chat"
export const resetChatHistory = () => {
  chatHistory = [];
};

async function runChat(prompt) {
  if (!API_KEY) return "Thiếu API Key!";

  try {
    const store = await getVectorStore();

    // Lấy ngữ cảnh từ Vector DB
    const searchResults = await store.similaritySearch(prompt, 3);
    const context = searchResults.map((res) => res.pageContent).join("\n\n");

    const genAI = new GoogleGenerativeAI(API_KEY);
    
    // Sử dụng systemInstruction để định hình nhân vật và quy tắc cực kỳ nghiêm ngặt
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: `Bạn là trợ lý học tập môn Tin học hỗ trợ sinh viên.
Quy tắc xử lý:
1. Đọc [Ngữ cảnh từ tài liệu] được đính kèm trong câu hỏi.
2. Kiểm tra xem câu hỏi của sinh viên có liên quan đến các chủ đề trong ngữ cảnh hoặc môn Tin học nói chung hay không.
3. Nếu ĐÚNG chủ đề: Trả lời sinh viên trực tiếp, xưng hô lịch sự, tự nhiên. Sử dụng kiến thức của bạn để giải thích chi tiết.
4. Nếu SAI chủ đề (ví dụ: hỏi về thời tiết, giải trí, toán học khác...): Từ chối lịch sự và nhắc nhở rằng bạn chỉ hỗ trợ giải đáp môn Tin học.
5. Tuyệt đối KHÔNG tự tạo ra các đoạn hội thoại mẫu (kiểu "Học sinh: ... / Chuyên gia: ..."). Chỉ trả lời thẳng vào vấn đề.`
    });

    // Khởi tạo phiên chat kèm theo lịch sử các tin nhắn trước đó
    const chat = model.startChat({
      history: chatHistory,
    });

    // Gắn context ngầm vào câu hỏi hiện tại để model đọc, nhưng user không thấy
    const fullPrompt = `[Ngữ cảnh từ tài liệu]:\n${context}\n\n[Câu hỏi của sinh viên]: ${prompt}`;

    // Gửi tin nhắn
    const result = await chat.sendMessage(fullPrompt);
    const responseText = result.response.text();

    // Cập nhật lịch sử (Lưu lại chính xác những gì user hỏi và bot đáp)
    chatHistory.push({ role: "user", parts: [{ text: prompt }] });
    chatHistory.push({ role: "model", parts: [{ text: responseText }] });

    // Giữ lại tối đa 6 tin nhắn gần nhất (3 lượt trao đổi giữa 2 bên) để nhớ ngữ cảnh
    if (chatHistory.length > 6) {
      chatHistory = chatHistory.slice(chatHistory.length - 6);
    }

    return responseText;
  } catch (error) {
    console.error("Lỗi tại runChat:", error);
    return "Có lỗi xảy ra trong quá trình xử lý, vui lòng thử lại.";
  }
}

export default runChat;