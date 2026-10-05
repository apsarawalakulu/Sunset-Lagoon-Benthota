export function getCloudinaryConfig(): { cloudName: string; preset: string } {
  const cloudName = import.meta.env["VITE_CLOUDINARY_CLOUD_NAME"] ?? "";
  const preset = import.meta.env["VITE_CLOUDINARY_UPLOAD_PRESET"] ?? "";
  return { cloudName, preset };
}

export function isUploadConfigured(): boolean {
  const { cloudName, preset } = getCloudinaryConfig();
  return cloudName !== "" && preset !== "";
}

/**
 * Upload an image or video to Cloudinary using an unsigned upload preset.
 * Requires VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.
 * Reports upload progress when onProgress is provided (XMLHttpRequest).
 */
export async function uploadToCloudinary(
  file: File,
  onProgress?: (percent: number) => void
): Promise<{ url: string; mimeType: string; size: number }> {
  const { cloudName, preset } = getCloudinaryConfig();
  if (!cloudName || !preset) {
    throw new Error(
      "Media uploads are not configured yet. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in your .env file (Cloudinary Settings → Upload → Upload presets)."
    );
  }
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", preset);
  const json = await new Promise<{ secure_url?: string; error?: { message?: string } }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`);
    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          onProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
    }
    xhr.onload = () => {
      try {
        resolve(JSON.parse(xhr.responseText) as { secure_url?: string; error?: { message?: string } });
      } catch {
        reject(new Error("Upload failed. Unexpected server response."));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(formData);
  });
  if (!json?.secure_url) {
    throw new Error(json?.error?.message || "Upload failed. Check your Cloudinary preset settings.");
  }
  return { url: json.secure_url, mimeType: file.type || "", size: file.size || 0 };
}

export function formToRecord(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (typeof value === "string" && !(key in out)) out[key] = value;
  });
  return out;
}

export function formFile(formData: FormData, ...names: string[]): File | null {
  for (const name of names) {
    const value = formData.get(name);
    if (value instanceof File && value.size > 0) return value;
  }
  return null;
}
