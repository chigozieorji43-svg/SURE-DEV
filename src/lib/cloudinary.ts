export const CLOUDINARY_CLOUD_NAME = 'ojk0qrbo';
export const CLOUDINARY_UPLOAD_PRESET = 'SURE DEV';
export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

export interface CloudinaryUploadOptions {
  file: File | Blob;
  onProgress?: (progress: number) => void;
  folder?: string;
  tags?: string[];
}

export interface CloudinaryUploadResponse {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  created_at: string;
  url: string;
}

/**
 * Uploads an image file or blob directly to Cloudinary using the unsigned upload preset.
 */
export async function uploadToCloudinary(
  options: CloudinaryUploadOptions
): Promise<CloudinaryUploadResponse> {
  const { file, onProgress, folder = 'suredev_profiles', tags = ['suredev'] } = options;

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', CLOUDINARY_UPLOAD_URL, true);

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res: CloudinaryUploadResponse = JSON.parse(xhr.responseText);
          if (!res.secure_url) {
            throw new Error('Cloudinary response missing secure_url.');
          }
          resolve(res);
        } catch (err: any) {
          reject(new Error(err?.message || 'Invalid JSON response from Cloudinary.'));
        }
      } else {
        let errorMsg = `Cloudinary upload failed with status ${xhr.status}`;
        try {
          const errRes = JSON.parse(xhr.responseText);
          if (errRes.error?.message) {
            errorMsg = `Cloudinary Error: ${errRes.error.message}`;
          }
        } catch (_) {}
        reject(new Error(errorMsg));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during image upload to Cloudinary. Please check your connection.'));
    };

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    if (folder) {
      formData.append('folder', folder);
    }
    if (tags && tags.length > 0) {
      formData.append('tags', tags.join(','));
    }

    xhr.send(formData);
  });
}
