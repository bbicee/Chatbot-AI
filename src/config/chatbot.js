import { GoogleGenerativeAI } from "@google/generative-ai";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import knowledge from "../knowledge.json";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: API_KEY,
  model: "embedding-001",
});

let vectorStoreInstance = null;
let isInitializing = false;

// Hàm dừng chương trình (delay) để tránh spam API
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getVectorStore() {
  // 1. Trả về ngay nếu đã có instance
  if (vectorStoreInstance) return vectorStoreInstance;

  // 2. Nếu đang có tiến trình nạp khác, đợi nó xong
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

    // Khởi tạo store trống
    const store = new MemoryVectorStore(embeddings);

    // 3. Nạp dữ liệu theo từng cụm nhỏ (Batching)
    // Thay vì nạp tất cả, ta nạp mỗi lần 1 đoạn để không vi phạm giới hạn 429
    for (let i = 0; i < texts.length; i++) {
      await store.addDocuments([
        { pageContent: texts[i], metadata: { id: i } },
      ]);

      console.log(`Tiến độ: ${i + 1}/${texts.length} đoạn được nạp.`);

      // Nghỉ 2 giây sau mỗi lần nạp để an toàn tuyệt đối với gói Free
      await sleep(2000);
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

async function runChat(prompt) {
  if (!API_KEY) return "Thiếu API Key!";

  try {
    const store = await getVectorStore();

    // Tìm kiếm ngữ cảnh
    const searchResults = await store.similaritySearch(prompt, 2);
    const context = searchResults.map((res) => res.pageContent).join("\n\n");

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const fullPrompt = `Dựa vào tài liệu này:\n${context}\n\nCâu hỏi: ${prompt}\nTrả lời ngắn gọn:`;

    const result = await model.generateContent(fullPrompt);
    return result.response.text();
  } catch (error) {
    console.error("Lỗi tại runChat:", error);
    if (error.status === 429) {
      return "Hệ thống đang nạp dữ liệu, vui lòng đợi trong giây lát và gửi lại câu hỏi.";
    }
    return "Có lỗi xảy ra, vui lòng thử lại.";
  }
}

export default runChat;
