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
 */
export async function uploadToCloudinary(file: File): Promise<{ url: string; mimeType: string; size: number }> {
  const { cloudName, preset } = getCloudinaryConfig();
  if (!cloudName || !preset) {
    throw new Error(
      "Media uploads are not configured yet. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in your .env file (Cloudinary Settings → Upload → Upload presets)."
    );
  }
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", preset);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`, {
    method: "POST",
    body: formData,
  });
  let json: { secure_url?: string; error?: { message?: string } } | null = null;
  try {
    json = (await res.json()) as { secure_url?: string; error?: { message?: string } };
  } catch {
    json = null;
  }
  if (!res.ok || !json?.secure_url) {
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
