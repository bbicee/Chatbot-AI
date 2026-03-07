/**
 * Script tạo embeddings trước cho toàn bộ knowledge.json
 * Chạy 1 lần: npm run precompute
 * Output: src/embeddings.json
 */

import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { readFileSync, writeFileSync } from "fs";

// Đọc API key từ .env thủ công
const envContent = readFileSync("./.env", "utf-8");
const envVars = Object.fromEntries(
  envContent
    .split("\n")
    .filter((line) => line.includes("="))
    .map((line) => {
      const [key, ...val] = line.split("=");
      return [key.trim(), val.join("=").trim()];
    })
);

const API_KEY = envVars.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error("❌ Không tìm thấy VITE_GEMINI_API_KEY trong file .env");
  process.exit(1);
}

const knowledge = JSON.parse(readFileSync("./src/knowledge.json", "utf-8"));

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: API_KEY,
  model: "gemini-embedding-001",
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function precompute() {
  console.log("🚀 Bắt đầu tạo embeddings...");

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const texts = await splitter.splitText(knowledge.content);
  console.log(`📄 Đã chia thành ${texts.length} đoạn văn bản`);

  const vectors = [];
  const BATCH_SIZE = 5;

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);
    console.log(`⏳ Đang xử lý đoạn ${i + 1} - ${Math.min(i + BATCH_SIZE, texts.length)} / ${texts.length}...`);
    const batchVectors = await embeddings.embedDocuments(batch);
    vectors.push(...batchVectors);

    if (i + BATCH_SIZE < texts.length) {
      await sleep(1000);
    }
  }

  const output = {
    lastUpdated: new Date().toISOString(),
    model: "gemini-embedding-001",
    chunks: texts.map((text, i) => ({
      text,
      vector: vectors[i],
      metadata: { id: i },
    })),
  };

  writeFileSync("./src/embeddings.json", JSON.stringify(output));
  console.log(`✅ Hoàn thành! Đã lưu ${texts.length} embeddings vào src/embeddings.json`);
}

precompute().catch((err) => {
  console.error("❌ Lỗi:", err.message);
  process.exit(1);
});
