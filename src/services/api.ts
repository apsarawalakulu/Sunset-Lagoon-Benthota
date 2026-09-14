const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE_URL) throw new Error("The API is not connected yet.");
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export const api = {
  getExperiences: <T>() => request<T>("/experiences"),
  getGallery: <T>() => request<T>("/gallery-images"),
  sendContact: <T>(data: unknown) => request<T>("/contact-messages", { method: "POST", body: JSON.stringify(data) }),
  createBooking: <T>(data: unknown) => request<T>("/bookings", { method: "POST", body: JSON.stringify(data) }),
};