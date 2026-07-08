import apiClient from "./apiClient";

export async function getDashboardSummary() {
  const response = await apiClient.get("/dashboard/summary");
  return response.data;
}

export async function getFraudTrend() {
  const response = await apiClient.get("/dashboard/fraud-trend");
  return response.data;
}
