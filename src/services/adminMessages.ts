import { adminAuth, handleSessionError } from "./adminAuth";
import {
  adminMessageDeleteFn,
  adminMessageGetFn,
  adminMessageStatusFn,
  adminMessagesFn,
} from "../backend/admin";

export type MessageStatus = "unread" | "read" | "replied" | "archived";

export interface ContactMessageItem {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  clean_phone: string | null;
  subject: string | null;
  message: string;
  status: MessageStatus;
  created_at: string;
  created_at_formatted: string;
  created_at_diff: string;
  updated_at: string;
  quick_actions: {
    email_url: string;
    tel_url: string | null;
    whatsapp_url: string | null;
  };
}

export interface ContactMessageStats {
  total: number;
  unread: number;
  read: number;
  replied: number;
  archived: number;
}

export interface MessageListResponse {
  success: boolean;
  stats: ContactMessageStats;
  data: ContactMessageItem[];
}

export interface SingleMessageResponse {
  success: boolean;
  message?: string;
  data: ContactMessageItem;
}

function requireToken(): string {
  const token = adminAuth.getToken();
  if (!token) throw new Error("No active admin session found.");
  return token;
}

function sessionGuard(err: unknown): never {
  const message = err instanceof Error ? err.message : "";
  if (/Session expired|No active admin session|Access denied|Unauthorized/i.test(message)) {
    adminAuth.removeToken();
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/admin/login")) {
      window.location.href = "/admin/login";
    }
  }
  throw err instanceof Error ? err : new Error("Request failed.");
}

export const adminMessagesApi = {
  /**
   * Fetch all contact messages with live statistics and filters.
   */
  getMessages: async (params?: {
    status?: string;
    search?: string;
  }): Promise<MessageListResponse> => {
    const token = requireToken();
    try {
      return await adminMessagesFn({ data: { token, status: params?.status, search: params?.search } });
    } catch (err) {
      sessionGuard(err);
    }
  },

  /**
   * Fetch single contact message details.
   */
  getMessage: async (id: number): Promise<SingleMessageResponse> => {
    const token = requireToken();
    try {
      return await adminMessageGetFn({ data: { token, id } });
    } catch (err) {
      sessionGuard(err);
    }
  },

  /**
   * Quick action to mark a message as read.
   */
  markAsRead: async (id: number): Promise<SingleMessageResponse> => {
    const token = requireToken();
    try {
      return await adminMessageStatusFn({ data: { token, id, status: "read" } });
    } catch (err) {
      sessionGuard(err);
    }
  },

  /**
   * Quick action to mark a message as replied.
   */
  markAsReplied: async (id: number): Promise<SingleMessageResponse> => {
    const token = requireToken();
    try {
      return await adminMessageStatusFn({ data: { token, id, status: "replied" } });
    } catch (err) {
      sessionGuard(err);
    }
  },

  /**
   * Quick action to archive a contact message.
   */
  markAsArchived: async (id: number): Promise<SingleMessageResponse> => {
    const token = requireToken();
    try {
      return await adminMessageStatusFn({ data: { token, id, status: "archived" } });
    } catch (err) {
      sessionGuard(err);
    }
  },

  /**
   * Update message status generically (e.g. mark as unread or transition).
   */
  updateStatus: async (
    id: number,
    status: MessageStatus | "new"
  ): Promise<SingleMessageResponse> => {
    const token = requireToken();
    try {
      return await adminMessageStatusFn({ data: { token, id, status } });
    } catch (err) {
      sessionGuard(err);
    }
  },

  /**
   * Permanently delete a contact message.
   */
  deleteMessage: async (id: number): Promise<{ success: boolean; message: string }> => {
    const token = requireToken();
    try {
      return await adminMessageDeleteFn({ data: { token, id } });
    } catch (err) {
      handleSessionError(err);
    }
  },
};
