export interface NotificationHistoryReadModel {
  notificationId: string;
  recipientId: string;
  channel: string;
  status: string;
  title: string;
  body: string;
  createdAt: Date;
  sentAt?: Date;
  failedReason?: string;
  metadata?: Record<string, any>;
}

export interface NotificationHistoryQuery {
  recipientId?: string;
  channel?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface NotificationHistoryResult {
  notifications: NotificationHistoryReadModel[];
  total: number;
  hasMore: boolean;
}