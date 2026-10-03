import { http, ApiError } from './client';

export const getUserProfile = () => http.get('/user/profile');

/** Accepts any subset of { name, recovery_email, profileImage, currency_preference, currentPassword, newPassword }. */
export const updateUserProfile = (updates) => http.put('/user/profile', updates);

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const isImageUploadConfigured = Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET);

/** Uploads an image to Cloudinary (unsigned preset) and resolves with its secure URL. */
export async function uploadProfileImage(file) {
  if (!isImageUploadConfigured) {
    throw new ApiError('Image uploads are not configured for this deployment.');
  }
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
    method: 'POST',
    body: formData,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.secure_url) {
    throw new ApiError(data?.error?.message || 'Image upload failed', response.status);
  }
  return data.secure_url;
}
