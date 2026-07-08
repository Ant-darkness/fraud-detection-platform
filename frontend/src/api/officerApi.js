import axiosInstance from "./axios";

export async function getOfficers() {
  const response = await axiosInstance.get("/officers");
  return response.data;
}

export async function createOfficer(officerPayload) {
  const response = await axiosInstance.post("/officers", officerPayload);
  return response.data;
}

export async function updateOfficerStatus(officerId, isActive) {
  const response = await axiosInstance.patch(`/officers/${officerId}/status`, {
    is_active: isActive,
  });
  return response.data;
}

export async function deleteOfficer(officerId) {
  const response = await axiosInstance.delete(`/officers/${officerId}`);
  return response.data;
}
