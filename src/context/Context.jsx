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

  const delayPara = (index, nextWord) => {
    setTimeout(function () {
      setResultData((prev) => prev + nextWord);
    }, 75 * index);
  };
  const newChat = () => {
    setLoading(false);
    setShowResult(false);
  };

  const onSent = async (input) => {
    if (!input || loading) return; // Chống gửi rỗng hoặc gửi khi đang load

    setResultData("");
    setLoading(true);
    setShowResult(true);
    setRecentPrompt(input);

    try {
      const response = await runChat(input);
      let responseArray = response.split(" ");
      for (let i = 0; i < responseArray.length; i++) {
        const nextWord = responseArray[i];
        delayPara(i, nextWord + " ");
      }
    } catch (error) {
      setResultData("Lỗi kết nối. Vui lòng thử lại.");
    } finally {
      setLoading(false);
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
  };

  return (
    <Context.Provider value={contextValue}>{props.children}</Context.Provider>
  );
};

export default ContextProvider;
