import axiosInstance from "./axios";

export async function getPendingReviews() {
  const response = await axiosInstance.get("/reviews/pending");
  return response.data;
}

export async function getReviewHistory() {
  const response = await axiosInstance.get("/reviews/history");
  return response.data;
}

export async function approveReview(reviewId) {
  const response = await axiosInstance.post(`/reviews/${reviewId}/approve`);
  return response.data;
}

export async function rejectReview(reviewId) {
  const response = await axiosInstance.post(`/reviews/${reviewId}/reject`);
  return response.data;
}
