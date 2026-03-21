// Base URL — set VITE_API_URL in your .env file to override
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const getToken = () => localStorage.getItem("token");

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// ── POST /users/login ─────────────────────────────────────────────────────────
export const loginUser = async (username, password) => {
  const res = await fetch(`${API_BASE}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
};

// ── GET /users ────────────────────────────────────────────────────────────────
export const getUsers = async () => {
  const res = await fetch(`${API_BASE}/users`, {
    headers: authHeaders(),
  });
  return res.json();
};

// ── POST /users ───────────────────────────────────────────────────────────────
export const createUser = async (data) => {
  const res = await fetch(`${API_BASE}/users/register`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

// ── PUT /users/:id ────────────────────────────────────────────────────────────
export const updateUser = async (id, data) => {
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

// ── DELETE /users/:id ─────────────────────────────────────────────────────────
export const deleteUser = async (id) => {
  const res = await fetch(`${API_BASE}/users/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return res.json();
};
