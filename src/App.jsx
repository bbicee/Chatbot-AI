import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar';
import Main from './components/Main/Main';

const RedirectToStaticHome = () => {
  useEffect(() => {
    window.location.href = '/home.html';
  }, []);
  
  return null;
};

const ChatbotLayout = () => {
  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <Main />
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RedirectToStaticHome />} />
        <Route path="/chatbot" element={<ChatbotLayout />} />
        <Route path="/documents" element={<ChatbotLayout />} />
      </Routes>
    </Router>
  );
};

export default App;