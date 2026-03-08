import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import pdfParse from "@cedrugs/pdf-parse";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PDF_DIR = path.join(__dirname, "data/pdfs");
const OUTPUT_FILE = path.join(__dirname, "src/knowledge.json");

// Đệ quy tìm tất cả file .pdf trong thư mục và các thư mục con
async function findAllPdfs(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await findAllPdfs(fullPath);
      results.push(...nested);
    } else if (entry.isFile() && entry.name.endsWith(".pdf")) {
      results.push(fullPath);
    }
  }
  return results;
}

async function extractPdfs() {
  try {
    await fs.ensureDir(PDF_DIR);
    await fs.ensureDir(path.dirname(OUTPUT_FILE));

    const pdfFiles = await findAllPdfs(PDF_DIR);

    if (pdfFiles.length === 0) {
      console.log("⚠️ Thư mục data/pdfs trống hoặc không tìm thấy file .pdf");
      return;
    }

    let fullText = "";
    console.log(`🚀 Đang trích xuất dữ liệu từ ${pdfFiles.length} file...`);

    for (const filePath of pdfFiles) {
      const relativePath = path.relative(PDF_DIR, filePath);
      try {
        const dataBuffer = await fs.readFile(filePath);
        const data = await pdfParse(dataBuffer);
        fullText += `\n--- NGUỒN: ${relativePath} ---\n`;
        fullText += data.text;
        console.log(`✅ Thành công: ${relativePath}`);
      } catch (err) {
        console.error(`❌ Lỗi tại file "${relativePath}":`, err.message);
      }
    }

    const knowledgeData = {
      lastUpdated: new Date().toISOString(),
      content: fullText.replace(/\s+/g, " ").trim(),
    };

    await fs.outputJson(OUTPUT_FILE, knowledgeData, { spaces: 2 });
    console.log(`\n🎉 HOÀN THÀNH! Kết quả lưu tại: ${OUTPUT_FILE}`);
  } catch (error) {
    console.error("Lỗi hệ thống nghiêm trọng:", error);
  }
}

extractPdfs();
