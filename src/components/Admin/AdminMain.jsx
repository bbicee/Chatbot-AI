import React, { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUsers, createUser, updateUser, deleteUser } from "../../services/userService";
import "./AdminMain.css";

// ─── Initial Data ─────────────────────────────────────────────────────────────

const INITIAL_SUBJECTS = [
  {
    id: 1, name: "Tin học đại cương", code: "CS101",
    desc: "Giới thiệu các khái niệm cơ bản về máy tính và lập trình",
    chapters: [
      { id: 1, name: "Chương 1 – Giới thiệu máy tính", desc: "Tổng quan về phần cứng và phần mềm",
        files: [{ name: "Giao_trinh_C1.pdf", size: "2.4 MB" }] },
      { id: 2, name: "Chương 2 – Hệ điều hành", desc: "Windows, Linux và các khái niệm cơ bản",
        files: [{ name: "HeDieuHanh_slides.pdf", size: "1.8 MB" }] },
      { id: 3, name: "Chương 3 – Mạng máy tính", desc: "Giao thức và kết nối mạng", files: [] },
    ],
  },
  {
    id: 2, name: "Lập trình Python", code: "CS201",
    desc: "Ngôn ngữ lập trình Python từ cơ bản đến nâng cao",
    chapters: [
      { id: 4, name: "Chương 1 – Cú pháp cơ bản", desc: "Biến, kiểu dữ liệu, câu lệnh điều kiện",
        files: [{ name: "Python_C1_Lab.pdf", size: "3.1 MB" }, { name: "Python_C1_Slides.pdf", size: "1.2 MB" }] },
      { id: 5, name: "Chương 2 – Hàm và Module", desc: "Định nghĩa hàm, modules và packages",
        files: [{ name: "Python_C2.pdf", size: "2.0 MB" }] },
    ],
  },
  {
    id: 3, name: "Cơ sở dữ liệu", code: "CS301",
    desc: "Thiết kế và quản lý cơ sở dữ liệu quan hệ",
    chapters: [
      { id: 6, name: "Chương 1 – Mô hình ER", desc: "Thiết kế mô hình thực thể liên kết",
        files: [{ name: "CSDL_ER_Diagram.pdf", size: "1.5 MB" }] },
      { id: 7, name: "Chương 2 – SQL cơ bản", desc: "Câu lệnh SELECT, INSERT, UPDATE, DELETE", files: [] },
    ],
  },
];


const INITIAL_ACTIVITY = [
  { text: <>Tải lên PDF <strong>Chương 1 – Tin học đại cương</strong></>, time: "Hôm nay, 09:14", color: "#2777fc" },
  { text: <>Thêm tài khoản mới <strong>nguyenvana</strong></>, time: "Hôm nay, 08:50", color: "#7c3aed" },
  { text: <>Tạo môn học <strong>Cơ sở dữ liệu</strong></>, time: "Hôm qua, 15:30", color: "#16a34a" },
  { text: <>Xóa chương <strong>Chương 4 – Mạng máy tính</strong></>, time: "Hôm qua, 11:05", color: "#ea580c" },
];

// ─── Toast Hook ───────────────────────────────────────────────────────────────
function useToast() {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const show = useCallback((msg, type = "success") => {
    const id = ++idRef.current;
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, removing: true } : t)));
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 260);
    }, 3500);
  }, []);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, removing: true } : t)));
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 260);
  }, []);

  return { toasts, show, remove };
}

// ─── Toast Renderer ───────────────────────────────────────────────────────────
function ToastContainer({ toasts, onClose }) {
  const icons = { success: "✅", error: "❌", info: "ℹ️" };
  return (
    <div className="db-toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`db-toast db-toast-${t.type} ${t.removing ? "removing" : ""}`}>
          <div className="db-toast-icon">{icons[t.type]}</div>
          <div className="db-toast-msg">{t.msg}</div>
          <button className="db-toast-close" onClick={() => onClose(t.id)}>✕</button>
        </div>
      ))}
    </div>
  );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────
function ConfirmModal({ data, onConfirm, onCancel }) {
  if (!data) return null;
  return (
    <div className="db-modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="db-modal db-modal-sm">
        <div className="db-confirm-icon">⚠️</div>
        <div className="db-confirm-title">Xác nhận xóa</div>
        <div className="db-confirm-msg">{data.msg}</div>
        <div className="db-modal-footer db-modal-footer-center">
          <button className="db-btn db-btn-secondary" onClick={onCancel}>Hủy</button>
          <button className="db-btn db-btn-danger" onClick={onConfirm}>🗑 Xóa</button>
        </div>
      </div>
    </div>
  );
}

// ─── Logout Confirm ───────────────────────────────────────────────────────────
function LogoutModal({ open, onCancel, onConfirm }) {
  if (!open) return null;
  return (
    <div className="db-modal-overlay" onClick={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="db-modal db-modal-sm">
        <div className="db-confirm-icon">🚪</div>
        <div className="db-confirm-title">Đăng xuất</div>
        <div className="db-confirm-msg">Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?</div>
        <div className="db-modal-footer db-modal-footer-center">
          <button className="db-btn db-btn-secondary" onClick={onCancel}>Hủy</button>
          <button className="db-btn db-btn-primary" onClick={onConfirm}>🚪 Đăng xuất</button>
        </div>
      </div>
    </div>
  );
}

// ─── Overview Page ────────────────────────────────────────────────────────────
function OverviewPage({ subjects, users }) {
  const totalChapters = subjects.reduce((a, s) => a + s.chapters.length, 0);
  const totalFiles = subjects.reduce((a, s) => a + s.chapters.reduce((b, c) => b + c.files.length, 0), 0);

  return (
    <div className="db-page-body">
      <div className="db-ai-banner">
        <div className="db-ai-banner-icon">🤖</div>
        <div>
          <div className="db-ai-banner-title">Hệ thống RAG Chatbot – Powered by Gemini AI</div>
          <div className="db-ai-banner-desc">
            Trợ lý học tập thông minh đọc tài liệu PDF được tải lên và trả lời câu hỏi dựa trên nội dung đó.
            Quản lý môn học và tài liệu tại đây để cập nhật tri thức cho AI.
          </div>
          <div className="db-ai-tags">
            <span className="db-ai-tag">🧠 Gemini 2.5 Flash</span>
            <span className="db-ai-tag">🗄 RAG Pipeline</span>
            <span className="db-ai-tag">📄 PDF Knowledge Base</span>
            <span className="db-ai-tag">🔢 Embeddings</span>
          </div>
        </div>
      </div>

      <div className="db-stats-grid">
        <div className="db-stat-card">
          <div className="db-stat-icon blue">📚</div>
          <div><div className="db-stat-value">{subjects.length}</div><div className="db-stat-label">Môn học</div></div>
        </div>
        <div className="db-stat-card">
          <div className="db-stat-icon purple">📑</div>
          <div><div className="db-stat-value">{totalChapters}</div><div className="db-stat-label">Chương</div></div>
        </div>
        <div className="db-stat-card">
          <div className="db-stat-icon green">📄</div>
          <div><div className="db-stat-value">{totalFiles}</div><div className="db-stat-label">Tài liệu PDF</div></div>
        </div>
        <div className="db-stat-card">
          <div className="db-stat-icon orange">👥</div>
          <div><div className="db-stat-value">{users.length}</div><div className="db-stat-label">Tài khoản</div></div>
        </div>
      </div>

      <div className="db-overview-grid">
        <div className="db-card">
          <div className="db-card-header">
            <div className="db-card-title">🕐 Hoạt động gần đây</div>
          </div>
          <div className="db-card-body">
            {INITIAL_ACTIVITY.map((a, i) => (
              <div className="db-activity-item" key={i}>
                <div className="db-activity-dot" style={{ background: a.color }} />
                <div>
                  <div className="db-activity-text">{a.text}</div>
                  <div className="db-activity-time">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="db-card">
          <div className="db-card-header">
            <div className="db-card-title">ℹ️ Thông tin hệ thống</div>
          </div>
          <div className="db-card-body">
            {[
              { label: "✅ Trạng thái AI",  value: "Hoạt động",       color: "#16a34a" },
              { label: "🌐 Model AI",        value: "Gemini 2.5 Flash", color: "#2777fc" },
              { label: "🗄 Vector Store",    value: "Memory (In-memory)", color: "#7c3aed" },
              { label: "💻 Framework",       value: "React + Vite",     color: "#ea580c" },
            ].map((row, i) => (
              <div className="db-sys-info-row" key={i}>
                <span className="db-sys-info-label">{row.label}</span>
                <span className="db-sys-info-value" style={{ color: row.color }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Subject Modal ────────────────────────────────────────────────────────────
function SubjectModal({ data, onClose, onSave }) {
  const [name, setName] = useState(data?.name || "");

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim() });
  };

  return (
    <div className="db-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="db-modal">
        <div className="db-modal-title">
          <span className="db-modal-title-icon">📚</span>
          {data ? "Sửa môn học" : "Thêm môn học"}
        </div>
        <div className="db-modal-body">
          <div className="db-form-group">
            <label className="db-form-label">Tên môn học <span style={{ color: "#e53935" }}>*</span></label>
            <input className="db-form-input" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="VD: Tin học đại cương" autoFocus />
          </div>
        </div>
        <div className="db-modal-footer">
          <button className="db-btn db-btn-secondary" onClick={onClose}>Hủy</button>
          <button className="db-btn db-btn-primary" onClick={handleSave}>💾 Lưu</button>
        </div>
      </div>
    </div>
  );
}

// ─── Chapter Modal ────────────────────────────────────────────────────────────
function ChapterModal({ data, onClose, onSave }) {
  const [name, setName] = useState(data?.name || "");

  return (
    <div className="db-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="db-modal">
        <div className="db-modal-title">
          <span className="db-modal-title-icon">📑</span>
          {data ? "Sửa chương" : "Thêm chương"}
        </div>
        <div className="db-modal-body">
          <div className="db-form-group">
            <label className="db-form-label">Tên chương <span style={{ color: "#e53935" }}>*</span></label>
            <input className="db-form-input" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="VD: Chương 1 – Giới thiệu" autoFocus />
          </div>
        </div>
        <div className="db-modal-footer">
          <button className="db-btn db-btn-secondary" onClick={onClose}>Hủy</button>
          <button className="db-btn db-btn-primary" onClick={() => { if (name.trim()) onSave({ name: name.trim() }); }}>
            💾 Lưu
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Upload PDF Modal ─────────────────────────────────────────────────────────
function UploadModal({ chapterInfo, onClose, onSave }) {
  const [file, setFile] = useState(null);
  const [drag, setDrag] = useState(false);
  const inputRef = useRef();

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files[0];
    if (f && f.name.toLowerCase().endsWith(".pdf")) setFile(f);
  };

  return (
    <div className="db-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="db-modal">
        <div className="db-modal-title">
          <span className="db-modal-title-icon">📤</span>
          Tải lên tài liệu PDF
        </div>
        <div className="db-modal-body">
          <div className="db-form-group">
            <label className="db-form-label">Môn học &amp; Chương</label>
            <div className="db-form-info">{chapterInfo}</div>
          </div>
          <div className="db-form-group">
            <label className="db-form-label">Chọn file PDF <span style={{ color: "#e53935" }}>*</span></label>
            <div
              className={`db-upload-area ${drag ? "drag-over" : ""}`}
              onClick={() => inputRef.current.click()}
              onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
              onDragLeave={() => setDrag(false)}
              onDrop={handleDrop}
            >
              <div className="db-upload-icon">☁️</div>
              <div className="db-upload-hint">Nhấn để chọn file hoặc kéo thả vào đây</div>
              <div className="db-upload-filename">
                {file ? `✓ ${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)` : "Hỗ trợ: PDF (tối đa 20MB)"}
              </div>
            </div>
            <input ref={inputRef} type="file" accept=".pdf" style={{ display: "none" }}
              onChange={(e) => { if (e.target.files[0]) setFile(e.target.files[0]); }} />
          </div>
        </div>
        <div className="db-modal-footer">
          <button className="db-btn db-btn-secondary" onClick={onClose}>Hủy</button>
          <button className="db-btn db-btn-primary" onClick={() => file && onSave(file)}>
            📤 Tải lên
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Subjects Page ────────────────────────────────────────────────────────────
function SubjectsPage({ subjects, setSubjects, toast }) {
  const [filter, setFilter] = useState("");
  const [openIds, setOpenIds] = useState(new Set());
  const [subjectModal, setSubjectModal] = useState(null); // null | { editing: obj|null }
  const [chapterModal, setChapterModal] = useState(null); // null | { subjectId, editing: obj|null }
  const [uploadModal, setUploadModal] = useState(null);   // null | { chapterId, subjectId }
  const [confirm, setConfirm] = useState(null);
  const nextSubjectId = useRef(subjects.length ? Math.max(...subjects.map(s => s.id)) + 1 : 1);
  const nextChapterId = useRef(
    subjects.flatMap(s => s.chapters).length
      ? Math.max(...subjects.flatMap(s => s.chapters).map(c => c.id)) + 1
      : 1
  );

  const toggleOpen = (id) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const filtered = subjects.filter((s) =>
    s.name.toLowerCase().includes(filter.toLowerCase())
  );

  // Subject CRUD
  const saveSubject = ({ name }) => {
    if (subjectModal?.editing) {
      setSubjects((prev) => prev.map((s) => s.id === subjectModal.editing.id ? { ...s, name } : s));
      toast("Cập nhật môn học thành công!");
    } else {
      const id = nextSubjectId.current++;
      setSubjects((prev) => [...prev, { id, name, chapters: [] }]);
      setOpenIds((prev) => new Set([...prev, id]));
      toast("Thêm môn học thành công!");
    }
    setSubjectModal(null);
  };

  const deleteSubject = (s) => {
    setConfirm({
      msg: `Xóa môn học "${s.name}"? Tất cả chương và tài liệu sẽ bị mất!`,
      fn: () => {
        setSubjects((prev) => prev.filter((x) => x.id !== s.id));
        toast("Đã xóa môn học!", "info");
      },
    });
  };

  // Chapter CRUD
  const saveChapter = ({ name }) => {
    const { subjectId, editing } = chapterModal;
    if (editing) {
      setSubjects((prev) => prev.map((s) => s.id === subjectId
        ? { ...s, chapters: s.chapters.map((c) => c.id === editing.id ? { ...c, name } : c) }
        : s
      ));
      toast("Cập nhật chương thành công!");
    } else {
      const id = nextChapterId.current++;
      setSubjects((prev) => prev.map((s) => s.id === subjectId
        ? { ...s, chapters: [...s.chapters, { id, name, files: [] }] }
        : s
      ));
      setOpenIds((prev) => new Set([...prev, subjectId]));
      toast("Thêm chương thành công!");
    }
    setChapterModal(null);
  };

  const deleteChapter = (c, subjectId) => {
    setConfirm({
      msg: `Xóa chương "${c.name}"? Tất cả tài liệu sẽ bị mất!`,
      fn: () => {
        setSubjects((prev) => prev.map((s) => s.id === subjectId
          ? { ...s, chapters: s.chapters.filter((x) => x.id !== c.id) }
          : s
        ));
        toast("Đã xóa chương!", "info");
      },
    });
  };

  // File CRUD
  const saveFile = (file) => {
    const { chapterId } = uploadModal;
    setSubjects((prev) => prev.map((s) => ({
      ...s,
      chapters: s.chapters.map((c) => c.id === chapterId
        ? { ...c, files: [...c.files, { name: file.name, size: (file.size / 1024 / 1024).toFixed(1) + " MB" }] }
        : c
      ),
    })));
    toast(`Tải lên "${file.name}" thành công!`);
    setUploadModal(null);
  };

  const deleteFile = (chapterId, idx, fileName) => {
    setConfirm({
      msg: `Xóa file "${fileName}"?`,
      fn: () => {
        setSubjects((prev) => prev.map((s) => ({
          ...s,
          chapters: s.chapters.map((c) => c.id === chapterId
            ? { ...c, files: c.files.filter((_, i) => i !== idx) }
            : c
          ),
        })));
        toast("Đã xóa file!", "info");
      },
    });
  };

  const getChapterInfo = () => {
    if (!uploadModal) return "";
    for (const s of subjects) {
      const c = s.chapters.find((x) => x.id === uploadModal.chapterId);
      if (c) return `${s.name} → ${c.name}`;
    }
    return "";
  };

  return (
    <div className="db-page-body">
      <div className="db-section-header">
        <div>
          <h2>Quản lý môn học</h2>
          <p>Tổ chức môn học theo chương và tải lên tài liệu PDF làm nguồn tri thức cho AI</p>
        </div>
        <div className="db-section-header-actions">
          <div className="db-search-bar">
            <span className="db-search-icon">🔍</span>
            <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Tìm môn học..." />
          </div>
          <button className="db-btn db-btn-primary" onClick={() => setSubjectModal({ editing: null })}>
            ＋ Thêm môn học
          </button>
        </div>
      </div>

      <div className="db-subject-list">
        {filtered.length === 0 && (
          <div className="db-empty-state">
            <div>📚</div>
            <p>Chưa có môn học nào. Nhấn "Thêm môn học" để bắt đầu.</p>
          </div>
        )}
        {filtered.map((s) => {
          const isOpen = openIds.has(s.id);
          const fileCount = s.chapters.reduce((a, c) => a + c.files.length, 0);
          return (
            <div className="db-subject-item" key={s.id}>
              <div
                className={`db-subject-header ${isOpen ? "open" : ""}`}
                onClick={() => toggleOpen(s.id)}
              >
                <div className="db-subject-caret">›</div>
                <div className="db-subject-icon">📖</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="db-subject-name">
                    {s.name}
                  </div>
                  <div className="db-subject-meta">{s.chapters.length} chương · {fileCount} tài liệu PDF</div>
                </div>
                <div className="db-subject-actions" onClick={(e) => e.stopPropagation()}>
                  <button className="db-btn db-btn-secondary db-btn-sm"
                    onClick={() => setSubjectModal({ editing: s })}>✏️ Sửa</button>
                  <button className="db-btn db-btn-danger db-btn-sm"
                    onClick={() => deleteSubject(s)}>🗑 Xóa</button>
                </div>
              </div>

              {isOpen && (
                <div className="db-chapter-list">
                  {s.chapters.map((c) => (
                    <div className="db-chapter-item" key={c.id}>
                      <div className="db-chapter-icon">📑</div>
                      <div className="db-chapter-info">
                        <div className="db-chapter-name">{c.name}</div>
                        <div className="db-chapter-files-label">
                          {c.files.length > 0 ? `${c.files.length} file PDF` : "Chưa có tài liệu"}
                        </div>
                        {c.files.length > 0 && (
                          <div className="db-file-list">
                            {c.files.map((f, idx) => (
                              <div className="db-file-item" key={idx}>
                                <span className="db-file-icon">📕</span>
                                <span className="db-file-name">{f.name}</span>
                                <span className="db-file-size">{f.size}</span>
                                <button className="db-file-delete-btn"
                                  onClick={() => deleteFile(c.id, idx, f.name)}>✕</button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="db-chapter-actions">
                        <button className="db-btn db-btn-secondary db-btn-sm"
                          onClick={() => setUploadModal({ chapterId: c.id, subjectId: s.id })}>
                          📤 Upload PDF
                        </button>
                        <button className="db-btn db-btn-warning db-btn-sm"
                          onClick={() => setChapterModal({ subjectId: s.id, editing: c })}>✏️</button>
                        <button className="db-btn db-btn-danger db-btn-sm"
                          onClick={() => deleteChapter(c, s.id)}>🗑</button>
                      </div>
                    </div>
                  ))}
                  <button className="db-chapter-add-row"
                    onClick={() => setChapterModal({ subjectId: s.id, editing: null })}>
                    ＋ Thêm chương
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {subjectModal && (
        <SubjectModal
          data={subjectModal.editing}
          onClose={() => setSubjectModal(null)}
          onSave={saveSubject}
        />
      )}
      {chapterModal && (
        <ChapterModal
          data={chapterModal.editing}
          onClose={() => setChapterModal(null)}
          onSave={saveChapter}
        />
      )}
      {uploadModal && (
        <UploadModal
          chapterInfo={getChapterInfo()}
          onClose={() => setUploadModal(null)}
          onSave={saveFile}
        />
      )}
      {confirm && (
        <ConfirmModal
          data={confirm}
          onConfirm={() => { confirm.fn(); setConfirm(null); }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

// ─── User Modal ───────────────────────────────────────────────────────────────
function UserModal({ data, onClose, onSave, canEditRole = true }) {
  const [name, setName] = useState(data?.name || "");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(data?.role ?? 0);
  const isEdit = !!data;

  return (
    <div className="db-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="db-modal">
        <div className="db-modal-title">
          <span className="db-modal-title-icon">{isEdit ? "✏️" : "👤"}</span>
          {isEdit ? `Sửa tài khoản: ${data.username}` : "Thêm tài khoản"}
        </div>
        <div className="db-modal-body">
          {!isEdit && (
            <div className="db-form-group">
              <label className="db-form-label">Tên đăng nhập <span style={{ color: "#e53935" }}>*</span></label>
              <input
                className="db-form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="VD: nguyenvana"
                autoFocus
              />
            </div>
          )}
          <div className="db-form-group">
            <label className="db-form-label">Họ và tên <span style={{ color: "#e53935" }}>*</span></label>
            <input
              className="db-form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Nguyễn Văn A"
              autoFocus={isEdit}
            />
          </div>
          {!isEdit && (
            <div className="db-form-group">
              <label className="db-form-label">Mật khẩu <span style={{ color: "#e53935" }}>*</span></label>
              <input
                className="db-form-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Nhập mật khẩu..."
              />
            </div>
          )}
          {canEditRole && (
            <div className="db-form-group">
              <label className="db-form-label">Vai trò</label>
              <select
                className="db-form-select"
                value={role}
                onChange={(e) => setRole(Number(e.target.value))}
              >
                <option value={0}>Người dùng</option>
                <option value={1}>Quản trị viên</option>
              </select>
            </div>
          )}
        </div>
        <div className="db-modal-footer">
          <button className="db-btn db-btn-secondary" onClick={onClose}>Hủy</button>
          <button
            className="db-btn db-btn-primary"
            onClick={() => onSave({ username: username.trim(), name: name.trim(), password, role, isEdit })}
          >
            💾 Lưu
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Change Password Modal ────────────────────────────────────────────────────
function ChangePasswordModal({ user, onClose, onSave }) {
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  return (
    <div className="db-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="db-modal">
        <div className="db-modal-title"><span className="db-modal-title-icon">🔑</span> Đổi mật khẩu</div>
        <div className="db-modal-body">
          <div className="db-form-group">
            <label className="db-form-label">Tài khoản</label>
            <div className="db-form-info">{user.username}{user.fullname ? ` (${user.fullname})` : ""}</div>
          </div>
          <div className="db-form-group">
            <label className="db-form-label">Mật khẩu mới <span style={{ color: "#e53935" }}>*</span></label>
            <input className="db-form-input" type="password" value={newPw}
              onChange={(e) => setNewPw(e.target.value)} placeholder="Nhập mật khẩu mới..." autoFocus />
          </div>
          <div className="db-form-group">
            <label className="db-form-label">Xác nhận mật khẩu <span style={{ color: "#e53935" }}>*</span></label>
            <input className="db-form-input" type="password" value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)} placeholder="Nhập lại mật khẩu..." />
          </div>
        </div>
        <div className="db-modal-footer">
          <button className="db-btn db-btn-secondary" onClick={onClose}>Hủy</button>
          <button className="db-btn db-btn-primary" onClick={() => onSave(newPw, confirmPw)}>💾 Cập nhật</button>
        </div>
      </div>
    </div>
  );
}

// ─── Accounts Page ────────────────────────────────────────────────────────────
function AccountsPage({ users, setUsers, currentUser, toast }) {
  const [filter, setFilter] = useState("");
  const [userModal, setUserModal] = useState(null);
  const [changePwModal, setChangePwModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const isAdmin = currentUser?.role === 1;

  const filtered = users.filter((u) => {
    const q = filter.toLowerCase();
    return (
      (u.username || "").toLowerCase().includes(q) ||
      (u.name || "").toLowerCase().includes(q)
    );
  });

  // ── PUT /users/:id  or  POST /users ─────────────────────────────────────
  const saveUser = async ({ username, name, password, role, isEdit }) => {
    if (!name.trim()) { toast("Vui lòng nhập họ và tên!", "error"); return; }
    if (!isEdit) {
      // CREATE
      if (!username.trim()) { toast("Vui lòng nhập tên đăng nhập!", "error"); return; }
      if (!password) { toast("Vui lòng nhập mật khẩu!", "error"); return; }
      if (password.length < 6) { toast("Mật khẩu phải có ít nhất 6 ký tự!", "error"); return; }
      try {
        const res = await createUser({ username: username.trim(), name: name.trim(), password, role });
        if (res.success !== false) {
          const newUser = res.data?.user || res.data || { username: username.trim(), name: name.trim(), role };
          setUsers((prev) => [...prev, newUser]);
          toast("Thêm tài khoản thành công!");
        } else {
          toast(res.message || "Thêm tài khoản thất bại!", "error"); return;
        }
      } catch {
        toast("Lỗi kết nối!", "error"); return;
      }
    } else {
      // UPDATE
      const id = userModal.editing.id;
      const body = isAdmin ? { name: name.trim(), role } : { name: name.trim() };
      try {
        const res = await updateUser(id, body);
        if (res.success !== false) {
          setUsers((prev) =>
            prev.map((u) => u.id === id ? { ...u, name: name.trim(), ...(isAdmin ? { role } : {}) } : u)
          );
          toast("Cập nhật tài khoản thành công!");
        } else {
          toast(res.message || "Cập nhật thất bại!", "error"); return;
        }
      } catch {
        toast("Lỗi kết nối!", "error"); return;
      }
    }
    setUserModal(null);
  };

  // ── DELETE /users/:id ─────────────────────────────────────────────────────
  const handleDeleteUser = (u) => {
    setConfirm({
      msg: `Xóa tài khoản "${u.username || u.name}"? Thao tác này không thể hoàn tác!`,
      fn: async () => {
        try {
          const res = await deleteUser(u.id);
          if (res.success !== false) {
            setUsers((prev) => prev.filter((x) => x.id !== u.id));
            toast("Đã xóa tài khoản!", "info");
          } else {
            toast(res.message || "Xóa thất bại!", "error");
          }
        } catch {
          toast("Lỗi kết nối!", "error");
        }
      },
    });
  };

  // ── PUT /users/:id (password) ─────────────────────────────────────────────
  const changePassword = async (newPw, confirmPw) => {
    if (!newPw) { toast("Vui lòng nhập mật khẩu mới!", "error"); return; }
    if (newPw.length < 6) { toast("Mật khẩu phải có ít nhất 6 ký tự!", "error"); return; }
    if (newPw !== confirmPw) { toast("Mật khẩu xác nhận không khớp!", "error"); return; }
    try {
      const res = await updateUser(changePwModal.id, { password: newPw });
      if (res.success !== false) {
        setChangePwModal(null);
        toast("Đổi mật khẩu thành công!");
      } else {
        toast(res.message || "Đổi mật khẩu thất bại!", "error");
      }
    } catch {
      toast("Lỗi kết nối!", "error");
    }
  };

  const avatarStyle = (role) => ({
    background:
      role === 1
        ? "linear-gradient(135deg, #7c3aed, #5b4cf5)"
        : "linear-gradient(135deg, #2777fc, #38b2fc)",
  });

  return (
    <div className="db-page-body">
      <div className="db-section-header">
        <div>
          <h2>Quản lý tài khoản</h2>
          <p>
            {isAdmin
              ? "Xem và quản lý toàn bộ tài khoản trong hệ thống"
              : "Xem danh sách tài khoản và chỉnh sửa hồ sơ của bạn"}
          </p>
        </div>
        <div className="db-section-header-actions">
          <div className="db-search-bar">
            <span className="db-search-icon">🔍</span>
            <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Tìm tài khoản..." />
          </div>
          {isAdmin && (
            <button className="db-btn db-btn-primary" onClick={() => setUserModal({ editing: null })}>
              ＋ Thêm tài khoản
            </button>
          )}
        </div>
      </div>

      <div className="db-card">
        <div className="db-card-header">
          <div className="db-card-title">📋 Danh sách tài khoản</div>
          <span style={{ fontSize: 12, color: "#8892a4" }}>{users.length} tài khoản</span>
        </div>
        <div className="db-table-wrap">
          <table className="db-table">
            <thead>
              <tr>
                <th>#</th>
                {isAdmin && <th>Tên đăng nhập</th>}
                <th>Họ và tên</th>
                {isAdmin && <th>Vai trò</th>}
                {isAdmin && <th>Ngày tạo</th>}
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 6 : 3}>
                    <div className="db-empty-state"><div>👥</div><p>Không tìm thấy tài khoản nào.</p></div>
                  </td>
                </tr>
              ) : (
                filtered.map((u, i) => {
                  const isOwnRow = u.id === currentUser?.id;
                  const canEdit = isAdmin || isOwnRow;
                  const canDelete = isAdmin ? u.id !== currentUser?.id : isOwnRow;
                  return (
                    <tr key={u.id}>
                      <td style={{ color: "#aab4cc", fontSize: 12 }}>{i + 1}</td>

                      {/* Username – admin only */}
                      {isAdmin && (
                        <td>
                          <div className="db-user-cell">
                            <div className="db-user-avatar" style={avatarStyle(u.role)}>
                              {(u.username || u.name || "?")[0].toUpperCase()}
                            </div>
                            <span style={{ fontWeight: 500 }}>{u.username}</span>
                            {isOwnRow && (
                              <span style={{
                                fontSize: 10, background: "#eef3ff", color: "#2777fc",
                                borderRadius: 4, padding: "1px 6px", marginLeft: 4,
                              }}>Bạn</span>
                            )}
                          </div>
                        </td>
                      )}

                      {/* Name – everyone sees */}
                      <td>
                        <div className="db-user-cell">
                          {!isAdmin && (
                            <div className="db-user-avatar" style={avatarStyle(u.role)}>
                              {(u.name || "?")[0].toUpperCase()}
                            </div>
                          )}
                          <span style={isOwnRow ? { fontWeight: 600 } : {}}>
                            {u.name || "–"}
                            {isOwnRow && !isAdmin && (
                              <span style={{
                                fontSize: 10, background: "#eef3ff", color: "#2777fc",
                                borderRadius: 4, padding: "1px 6px", marginLeft: 6,
                              }}>Bạn</span>
                            )}
                          </span>
                        </div>
                      </td>

                      {/* Role badge – admin only */}
                      {isAdmin && (
                        <td>
                          <span className={`db-badge ${u.role === 1 ? "db-badge-admin" : "db-badge-user"}`}>
                            <span className="db-badge-dot"
                              style={{ background: u.role === 1 ? "#7c3aed" : "#2777fc" }} />
                            {u.role === 1 ? "Quản trị viên" : "Giáo viên"}
                          </span>
                        </td>
                      )}

                      {/* Created at – admin only */}
                      {isAdmin && (
                        <td style={{ color: "#8892a4", fontSize: 12 }}>
                          {u.created_at
                            ? new Date(u.created_at).toLocaleDateString("vi-VN")
                            : "–"}
                        </td>
                      )}

                      {/* Actions */}
                      <td>
                        <div className="db-td-actions">
                          {canEdit && (
                            <button className="db-btn db-btn-secondary db-btn-sm"
                              onClick={() => setUserModal({ editing: u })}>✏️ Sửa</button>
                          )}
                          {isOwnRow && (
                            <button className="db-btn db-btn-warning db-btn-sm"
                              onClick={() => setChangePwModal(u)}>🔑 Đổi MK</button>
                          )}
                          {canDelete && (
                            <button className="db-btn db-btn-danger db-btn-sm"
                              onClick={() => handleDeleteUser(u)}>🗑</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {userModal && (
        <UserModal
          data={userModal.editing}
          canEditRole={isAdmin}
          onClose={() => setUserModal(null)}
          onSave={saveUser}
        />
      )}
      {changePwModal && (
        <ChangePasswordModal
          user={changePwModal}
          onClose={() => setChangePwModal(null)}
          onSave={changePassword}
        />
      )}
      {confirm && (
        <ConfirmModal
          data={confirm}
          onConfirm={async () => { await confirm.fn(); setConfirm(null); }}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────
const PAGE_TITLES = {
  overview: "Tổng quan",
  subjects: "Quản lý môn học",
  accounts: "Quản lý tài khoản",
};

function Topbar({ activePage, currentUser }) {
  const navigate = useNavigate();
  const displayName = currentUser?.name || currentUser?.username || "Giáo viên";
  const roleLabel = currentUser?.role === 1 ? "Quản trị viên" : "Giáo viên";
  return (
    <header className="db-topbar">
      <div className="db-topbar-left">
        <div className="db-topbar-title">
          <span className="brand-dot" />
          {PAGE_TITLES[activePage] || activePage}
        </div>
      </div>
      <div className="db-topbar-right">
        <button className="db-topbar-chatbot-link" onClick={() => navigate("/chatbot")}>
          🤖 Chatbot
        </button>
        <div className="db-topbar-user-info">
          <div className="db-topbar-user-name">{displayName}</div>
          <div className="db-topbar-user-role">{roleLabel}</div>
        </div>
        <div className="db-topbar-avatar" title={currentUser?.username}>
          {displayName[0].toUpperCase()}
        </div>
      </div>
    </header>
  );
}

// ─── DashboardMain ────────────────────────────────────────────────────────────
const DashboardMain = ({ activePage }) => {
  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  })();
  const [subjects, setSubjects] = useState(INITIAL_SUBJECTS);
  const [users, setUsers] = useState([]);
  const { toasts, show: showToast, remove: removeToast } = useToast();

  // ── GET /users on mount ───────────────────────────────────────────────────
  useEffect(() => {
    getUsers()
      .then((res) => {
        const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        setUsers(list);
      })
      .catch(() => showToast("Không thể tải danh sách tài khoản!", "error"));
  }, [showToast]);

  const renderPage = () => {
    switch (activePage) {
      case "overview":
        return <OverviewPage subjects={subjects} users={users} />;
      case "subjects":
        return <SubjectsPage subjects={subjects} setSubjects={setSubjects} toast={showToast} />;
      case "accounts":
        return <AccountsPage users={users} setUsers={setUsers} currentUser={currentUser} toast={showToast} />;
      default:
        return <OverviewPage subjects={subjects} users={users} />;
    }
  };

  return (
    <div className="db-main">
      <Topbar activePage={activePage} currentUser={currentUser} />
      {renderPage()}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  );
};

export default DashboardMain;
