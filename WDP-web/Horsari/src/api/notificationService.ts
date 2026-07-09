import api from './axios';

// Persisted, per-user, read/unread notifications — available to any
// authenticated role. Distinct from the admin-only ephemeral
// AdminNotification/useAdminSocket system (src/types/AdminNotification.ts),
// which is not backed by a database record.

export interface NotificationEntity {
  _id: string;
  recipientId: string;
  type: string;
  title: string;
  message: string;
  relatedEntityType: string | null;
  relatedEntityId: string | null;
  actionPayload: Record<string, unknown> | null;
  read: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  code: number;
  data: {
    items: NotificationEntity[];
    pagination: { totalItems: number; totalPages: number; currentPage: number; limit: number };
  };
  msg: string;
}

export const notificationService = {
  getMyNotifications: async (
    page = 1,
    limit = 20,
    unreadOnly = false,
  ): Promise<NotificationsResponse> => {
    try {
      const params: any = { page, limit };
      if (unreadOnly) params.unreadOnly = 'true';
      const response = await api.get('/notifications', { params });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to fetch notifications' };
    }
  },

  getUnreadCount: async (): Promise<{ code: number; data: { count: number }; msg: string }> => {
    try {
      const response = await api.get('/notifications/unread-count');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to fetch unread count' };
    }
  },

  markRead: async (id: string): Promise<{ code: number; data: NotificationEntity; msg: string }> => {
    try {
      const response = await api.patch(`/notifications/${id}/read`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to mark notification as read' };
    }
  },

  markAllRead: async (): Promise<{ code: number; msg: string }> => {
    try {
      const response = await api.patch('/notifications/mark-all-read');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { msg: 'Failed to mark all notifications as read' };
    }
  },
};
