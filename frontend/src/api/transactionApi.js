import apiClient from "./apiClient";

export async function getTransactions() {
  const response = await apiClient.get("/transactions");
  return response.data;
}

export async function getPendingReviews() {
  const response = await apiClient.get("/reviews/pending");
  return response.data;
}

export async function approveReview(reviewId) {
  const response = await apiClient.post(`/reviews/${reviewId}/approve`);
  return response.data;
}

export async function rejectReview(reviewId) {
  const response = await apiClient.post(`/reviews/${reviewId}/reject`);
  return response.data;
}
