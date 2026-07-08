import apiClient from "./apiClient";

export async function login(email, password) {
  const response = await apiClient.post("/auth/login", { email, password });
  return response.data;
}

export async function changePassword(oldPassword, newPassword) {
  const response = await apiClient.post("/auth/change-password", {
    old_password: oldPassword,
    new_password: newPassword,
  });
  return response.data;
}
