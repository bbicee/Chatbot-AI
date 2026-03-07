import React, { useContext, useState } from "react";
import "./Main.css";
import { assets } from "../../assets/assets";
import { Context } from "../../context/Context";
import ReactMarkdown from "react-markdown";
import { useLocation } from "react-router-dom"; // Import thêm Hook của React Router

const documentData = [
  {
    id: 1,
    title: "Chương 1: Tổng quan Hệ điều hành",
    files: [
      { id: 101, name: "BaiGiang_Chuong1.pdf", url: "/data/pdfs/C1/chuong1.pdf" },
      { id: 102, name: "ThucHanh_C1.pdf", url: "/data/pdfs/C1/thuchanh_chuong1.pdf" }
    ]
  }
];

const Main = () => {
  const {
    onSent,
    setInput,
    input,
    showResult,
    loading,
    resultData,
    recentPrompt,
    // Không cần dùng activeTab từ Context nữa
  } = useContext(Context);

  const [selectedFile, setSelectedFile] = useState(null);
  
  // Lấy đường dẫn URL hiện hành
  const location = useLocation();
  // Kiểm tra xem URL có chứa chữ "documents" hay không
  const isDocsMode = location.pathname.includes("/documents");

  const handleSend = () => {
    if (!input.trim()) return;
    onSent(input);
  };

  return (
    <div className="main">
      <div className="nav">
        {/* Đổi Title theo URL */}
        <p>{isDocsMode ? "Tài liệu học tập" : "Chatbot HCA"}</p>
        <img src={assets.user_icon} alt="user" />
      </div>

      <div className={`main-container ${isDocsMode ? 'docs-mode' : ''}`}>
        
        {/* NẾU LÀ TRANG CHATBOT */}
        {!isDocsMode && (
          <>
            {!showResult ? (
              <>
                <div className="greet">
                  <p><span>HNMU Computer Science Assistant xin chào!</span></p>
                  <p>Mình có thể hỗ trợ bạn nội dung gì hôm nay?</p>
                </div>

                <div className="cards">
                  <div className="card" onClick={() => onSent("Hướng dẫn sử dụng các hàm điều kiện và hàm tìm kiếm trong Excel")}>
                    <p>Hướng dẫn sử dụng các hàm điều kiện và hàm tìm kiếm trong Excel</p>
                    <img src={assets.compass_icon} alt="" />
                  </div>
                  <div className="card" onClick={() => onSent("Tóm tắt các kiến thức trọng tâm về cấu trúc máy tính và chức năng của hệ điều hành")}>
                    <p>Tóm tắt các kiến thức trọng tâm về cấu trúc máy tính và chức năng của hệ điều hành</p>
                    <img src={assets.bulb_icon} alt="" />
                  </div>
                  <div className="card" onClick={() => onSent("Tổng hợp các phím tắt hữu ích và thủ thuật giúp thao tác nhanh trên Windows và Word")}>
                    <p>Tổng hợp các phím tắt hữu ích và thủ thuật giúp thao tác nhanh trên Windows và Word</p>
                    <img src={assets.message_icon} alt="" />
                  </div>
                  <div className="card" onClick={() => onSent("Viết đoạn mã mẫu và giải thích logic thuật toán bằng ngôn ngữ Python và C++")}>
                    <p>Viết đoạn mã mẫu và giải thích logic thuật toán bằng ngôn ngữ Python và C++</p>
                    <img src={assets.code_icon} alt="" />
                  </div>
                </div>
              </>
            ) : (
              <div className="result">
                <div className="result-title">
                  <img src={assets.user_icon} alt="" />
                  <p>{recentPrompt}</p>
                </div>
                <div className="result-data">
                  {loading ? (
                    <div className="loader">...</div>
                  ) : (
                    <ReactMarkdown>{resultData}</ReactMarkdown>
                  )}
                </div>
              </div>
            )}

            <div className="main-bottom">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Nhập câu hỏi tại đây..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSend();
                  }}
                />
                <div>
                  <img src={assets.gallery_icon} alt="" />
                  <img src={assets.mic_icon} alt="" />
                  {input ? (
                    <img onClick={() => handleSend()} src={assets.send_icon} alt="" />
                  ) : null}
                </div>
              </div>
              <p className="bottom-info">
                Tini có thể mắc sai sót, vì vậy, nhớ xác minh câu trả lời của HCA.
              </p>
            </div>
          </>
        )}

        {/* NẾU LÀ TRANG DOCUMENTS */}
        {isDocsMode && (
          <div className="documents-view">
            <div className="doc-sidebar">
              <h3>Thư mục môn học</h3>
              <div className="chapter-list">
                {documentData.map((chapter) => (
                  <div key={chapter.id} className="chapter-item">
                    <h4 className="chapter-title">📂 {chapter.title}</h4>
                    <ul className="file-list">
                      {chapter.files.map((file) => (
                        <li
                          key={file.id}
                          className={`file-item ${selectedFile?.id === file.id ? "active-file" : ""}`}
                          onClick={() => setSelectedFile(file)}
                        >
                          📄 {file.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <div className="doc-viewer">
              {selectedFile ? (
                <div className="pdf-container">
                  <div className="pdf-header">
                    <h4>{selectedFile.name}</h4>
                    <button className="close-pdf-btn" onClick={() => setSelectedFile(null)}>Đóng</button>
                  </div>
                  <iframe src={selectedFile.url} title={selectedFile.name} className="pdf-iframe"></iframe>
                </div>
              ) : (
                <div className="empty-state">
                  <p>👈 Hãy chọn một tài liệu từ danh mục để bắt đầu học.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Main;