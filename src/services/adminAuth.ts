import { dbStatusFn, loginFn, meFn, setupFn } from "../backend/auth";
import { adminDashboardFn } from "../backend/admin";

export const ADMIN_TOKEN_KEY = "sunset_lagoon_admin_token";
export const ADMIN_USER_KEY = "sunset_lagoon_admin_user";

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at?: string | undefined;
}

export interface AdminLoginResponse {
  success: boolean;
  message: string;
  token: string;
  token_type: string;
  admin: AdminUser;
}

export interface AdminMeResponse {
  success: boolean;
  admin: AdminUser;
}

export interface DashboardStatistics {
  today_bookings?: number;
  today_guests?: number;
  upcoming_bookings?: number;
  available_boats?: number;
  total_boats?: number;
  total_bookings: number;
  pending_bookings: number;
  confirmed_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  total_reviews: number;
  pending_reviews: number;
  approved_reviews: number;
  total_experiences: number;
  active_experiences: number;
  unread_contact_messages: number;
  total_gallery_items: number;
  active_gallery_items: number;
}

export interface RecentBooking {
  id: number;
  booking_reference: string;
  full_name: string;
  experience?: {
    id: number;
    title: string;
    slug: string;
  } | null;
  booking_date: string;
  preferred_time: string;
  number_of_guests: number;
  status: string;
  created_at?: string | undefined;
}

export interface DashboardData {
  statistics: DashboardStatistics;
  recent_bookings: RecentBooking[];
}

export interface DashboardApiResponse {
  success: boolean;
  data: DashboardData;
}

function toError(err: unknown, fallback: string): Error {
  if (err instanceof Error) return new Error(err.message || fallback);
  return new Error(fallback);
}

export function handleSessionError(err: unknown): never {
  const message = err instanceof Error ? err.message : "";
  if (/Session expired|No active admin session|Access denied/i.test(message)) {
    adminAuth.removeToken();
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/admin/login")) {
      window.location.href = "/admin/login";
    }
  }
  throw err instanceof Error ? err : new Error("Request failed.");
}

class AdminAuthService {
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  }

  setToken(token: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  }

  removeToken(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
  }

  getStoredUser(): AdminUser | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(ADMIN_USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AdminUser;
    } catch {
      return null;
    }
  }

  setStoredUser(user: AdminUser | null): void {
    if (typeof window === "undefined") return;
    if (user) {
      localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(ADMIN_USER_KEY);
    }
  }

  getUser(): AdminUser | null {
    return this.getStoredUser();
  }

  getAuthHeader(): Record<string, string> {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  isAuthenticated(): boolean {
    return Boolean(this.getToken());
  }

  async dbStatus(): Promise<{ configured: boolean; needsSetup: boolean }> {
    try {
      return await dbStatusFn();
    } catch (err) {
      throw toError(err, "Could not reach the database.");
    }
  }

  async setup(input: { name: string; email: string; password: string }): Promise<AdminLoginResponse> {
    try {
      const res = await setupFn({ data: input });
      if (res.token) this.setToken(res.token);
      if (res.admin) this.setStoredUser(res.admin);
      return { success: true, message: "Admin account created.", token: res.token, token_type: "Bearer", admin: res.admin };
    } catch (err) {
      throw toError(err, "Setup failed. Please try again.");
    }
  }

  async login(credentials: { email: string; password: string }): Promise<AdminLoginResponse> {
    try {
      const res = await loginFn({ data: credentials });
      if (res.token) this.setToken(res.token);
      if (res.admin) this.setStoredUser(res.admin);
      return {
        success: true,
        message: "Admin authenticated successfully.",
        token: res.token,
        token_type: "Bearer",
        admin: res.admin,
      };
    } catch (err) {
      throw toError(err, "Login failed. Please try again.");
    }
  }

  async getMe(): Promise<AdminUser> {
    const token = this.getToken();
    if (!token) {
      this.removeToken();
      throw new Error("No active admin session found.");
    }
    try {
      const res = await meFn({ data: { token } });
      if (res.admin) this.setStoredUser(res.admin);
      return res.admin;
    } catch (err) {
      handleSessionError(err);
    }
  }

  async getDashboardData(): Promise<DashboardData> {
    const token = this.getToken();
    if (!token) {
      this.removeToken();
      throw new Error("No active admin session found.");
    }
    try {
      const res = await adminDashboardFn({ data: { token } });
      return res.data;
    } catch (err) {
      handleSessionError(err);
    }
  }

  async logout(): Promise<void> {
    this.removeToken();
  }
}

export const adminAuth = new AdminAuthService();
