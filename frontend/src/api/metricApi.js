import apiClient from "./apiClient";

export async function getLeaderboard() {
  const response = await apiClient.get("/metrics/leaderboard");
  return response.data;
}
