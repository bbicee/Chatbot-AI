const apiUrl = import.meta.env.VITE_API_URL;

const getToken = () => localStorage.getItem("token");

const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

export const loginUser = async (username, password) => {
  const res = await fetch(`${apiUrl}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return res.json();
};

export const getUsers = async () => {
  const res = await fetch(`${apiUrl}/users`, {
    headers: authHeaders(),
  });
  return res.json();
};

export const createUser = async (data) => {
  const res = await fetch(`${apiUrl}/users/register`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const updateUser = async (id, data) => {
  const res = await fetch(`${apiUrl}/users/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return res.json();
};

export const deleteUser = async (id) => {
  const res = await fetch(`${apiUrl}/users/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return res.json();
};
