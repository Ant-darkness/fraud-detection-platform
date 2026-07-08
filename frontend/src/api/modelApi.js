import apiClient from "./apiClient";

export async function getModels() {
  const response = await apiClient.get("/models");
  return response.data;
}

export async function activateModel(modelId) {
  const response = await apiClient.post(`/models/${modelId}/activate`);
  return response.data;
}

export async function rejectModel(modelId) {
  const response = await apiClient.post(`/models/${modelId}/reject`);
  return response.data;
}

export async function deleteModel(modelId) {
  const response = await apiClient.delete(`/models/${modelId}`);
  return response.data;
}
