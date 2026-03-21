import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Sidebar from './components/Sidebar/Sidebar';
import Main from './components/Main/Main';
import AdminSidebar from './components/Admin/AdminSidebar';
import AdminMain from './components/Admin/AdminMain';

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

const DashboardLayout = () => {
  const [activePage, setActivePage] = useState('overview');
  const [showLogout, setShowLogout] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => setShowLogout(true);

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}>
      <AdminSidebar
        activePage={activePage}
        onNavigate={setActivePage}
        onLogout={handleLogout}
      />
      <AdminMain
        activePage={activePage}
        onLogout={handleLogout}
      />
      {showLogout && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(10,18,50,0.35)',
          backdropFilter: 'blur(3px)', zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
          onClick={(e) => e.target === e.currentTarget && setShowLogout(false)}
        >
          <div style={{
            background: '#fff', borderRadius: 16, padding: 28,
            width: '90%', maxWidth: 360,
            boxShadow: '0 20px 60px rgba(39,119,252,0.15)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 36, marginBottom: 4 }}>🚪</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: '#1a1a2e', marginBottom: 6 }}>Đăng xuất</div>
            <div style={{ fontSize: 13.5, color: '#8892a4', marginBottom: 20 }}>
              Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
              <button
                style={{
                  padding: '8px 20px', borderRadius: 8, border: '1px solid #d0e0ff',
                  background: '#f2f7ff', color: '#2777fc', fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
                }}
                onClick={() => setShowLogout(false)}
              >
                Hủy
              </button>
              <button
                style={{
                  padding: '8px 20px', borderRadius: 8, border: 'none',
                  background: '#2777fc', color: '#fff', fontWeight: 500,
                  cursor: 'pointer', fontFamily: 'inherit', fontSize: 13,
                }}
                onClick={() => { setShowLogout(false); navigate('/'); }}
              >
                🚪 Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
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
        <Route path="/admin" element={<DashboardLayout />} />
      </Routes>
    </Router>
  );
};

export default App;