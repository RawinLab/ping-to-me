import { api } from "../api";

/**
 * Upload bio page avatar
 */
export async function uploadBioPageAvatar(
  bioPageId: string,
  file: File,
): Promise<{ avatarUrl: string }> {
  const formData = new FormData();
  formData.append("avatar", file);

  const response = await api.post(`/biopages/${bioPageId}/avatar`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

/**
 * Delete bio page avatar
 */
export async function deleteBioPageAvatar(bioPageId: string): Promise<void> {
  await api.delete(`/biopages/${bioPageId}/avatar`);
}
