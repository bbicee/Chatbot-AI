import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import pdfParse from "@cedrugs/pdf-parse";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PDF_DIR = path.join(__dirname, "data/pdfs");
const OUTPUT_FILE = path.join(__dirname, "src/knowledge.json");

async function extractPdfs() {
  try {
    await fs.ensureDir(PDF_DIR);
    await fs.ensureDir(path.dirname(OUTPUT_FILE));

    const files = await fs.readdir(PDF_DIR);
    const pdfFiles = files.filter((file) => file.endsWith(".pdf"));

    if (pdfFiles.length === 0) {
      console.log("⚠️ Thư mục data/pdfs trống hoặc không tìm thấy file .pdf");
      return;
    }

    let fullText = "";
    console.log(`🚀 Đang trích xuất dữ liệu từ ${pdfFiles.length} file...`);

    for (const file of pdfFiles) {
      try {
        const filePath = path.join(PDF_DIR, file);
        const dataBuffer = await fs.readFile(filePath);

        // SỬA Ở ĐÂY ────────────────
        const data = await pdfParse(dataBuffer);
        // ───────────────────────────

        fullText += `\n--- NGUỒN: ${file} ---\n`;
        fullText += data.text;
        console.log(`✅ Thành công: ${file}`);
      } catch (err) {
        console.error(`❌ Lỗi tại file "${file}":`, err.message);
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
