export interface NotificationStatsReadModel {
  date: string; // YYYY-MM-DD format
  channel: string;
  totalSent: number;
  totalFailed: number;
  totalDelivered: number;
}

export interface NotificationStatsQuery {
  channel?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface NotificationStatsResult {
  stats: NotificationStatsReadModel[];
  summary: {
    totalSent: number;
    totalFailed: number;
    totalDelivered: number;
    successRate: number;
  };
}

export interface ChannelStatsResult {
  channel: string;
  totalSent: number;
  totalFailed: number;
  totalDelivered: number;
  successRate: number;
  averageDeliveryTime?: number; // in milliseconds
}