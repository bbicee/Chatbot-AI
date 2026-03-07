import { createContext, useState } from "react";
import runChat from "../config/chatbot";

export const Context = createContext();

const ContextProvider = (props) => {
  const [input, setInput] = useState("");
  const [recentPrompt, setRecentPrompt] = useState("");
  const [prevPrompts, setPrevPrompts] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultData, setResultData] = useState("");
  const [activeTab, setActiveTab] = useState("chat");

  // Hàm tạo hiệu ứng gõ chữ (Typing effect)
  const delayPara = (index, nextWord) => {
    setTimeout(function () {
      setResultData((prev) => prev + nextWord);
    }, 75 * index);
  };

  const newChat = () => {
    setLoading(false);
    setShowResult(false);
    setResultData(""); // Xóa dữ liệu cũ khi bắt đầu chat mới
  };

  // Đổi tên tham số thành 'prompt' để tránh xung đột với state 'input'
  const onSent = async (prompt) => {
    // Ưu tiên dùng 'prompt' truyền vào, nếu không có thì dùng state 'input'
    const currentPrompt = prompt !== undefined && typeof prompt === 'string' ? prompt : input;

    if (!currentPrompt || loading) return; 

    setResultData("");
    setLoading(true);
    setShowResult(true);
    setRecentPrompt(currentPrompt);

    try {
      const response = await runChat(currentPrompt);
      
      // Tắt loading NGAY SAU KHI nhận data để UI chuyển sang chế độ hiển thị text
      setLoading(false); 
      
      if (response) {
        let responseArray = response.split(" ");
        for (let i = 0; i < responseArray.length; i++) {
          const nextWord = responseArray[i];
          delayPara(i, nextWord + " ");
        }
      }
    } catch (error) {
      console.error("Lỗi trong onSent:", error);
      setResultData("Lỗi kết nối. Vui lòng thử lại.");
      setLoading(false);
    } finally {
      // Chỉ dọn dẹp ô nhập liệu ở finally
      setInput("");
    }
  };

  const contextValue = {
    prevPrompts,
    setPrevPrompts,
    onSent,
    setRecentPrompt,
    recentPrompt,
    showResult,
    loading,
    resultData,
    input,
    setInput,
    newChat,
    activeTab,
    setActiveTab
  };

  return (
    <Context.Provider value={contextValue}>
      {props.children}
    </Context.Provider>
  );
};

export default ContextProvider;