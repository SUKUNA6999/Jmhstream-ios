import { db } from "./db";
import { eq, desc, sql, and } from "drizzle-orm";
import {
  adminUsers, notifications, announcements, siteSettings, adminLogs,
  featuredContent, contentReports, watchlistItems, analyticsEvents, broadcastMessages, apiKeys, appKeys,
  type AdminUser, type InsertAdminUser, type Notification, type InsertNotification,
  type Announcement, type InsertAnnouncement, type SiteSetting, type InsertSiteSetting,
  type AdminLog, type FeaturedContent, type InsertFeaturedContent,
  type ContentReport, type InsertContentReport, type WatchlistItem, type InsertWatchlistItem,
  type AnalyticsEvent, type BroadcastMessage, type InsertBroadcastMessage,
  type ApiKey, type InsertApiKey, type AppKey, type InsertAppKey
} from "@shared/schema";

export interface IStorage {
  getAdminUser(username: string): Promise<AdminUser | undefined>;
  createAdminUser(data: InsertAdminUser): Promise<AdminUser>;
  getNotifications(): Promise<Notification[]>;
  createNotification(data: InsertNotification): Promise<Notification>;
  updateNotification(id: string, data: Partial<InsertNotification>): Promise<Notification | undefined>;
  deleteNotification(id: string): Promise<void>;
  getAnnouncements(): Promise<Announcement[]>;
  createAnnouncement(data: InsertAnnouncement): Promise<Announcement>;
  updateAnnouncement(id: string, data: Partial<InsertAnnouncement>): Promise<Announcement | undefined>;
  deleteAnnouncement(id: string): Promise<void>;
  getSiteSettings(): Promise<SiteSetting[]>;
  getSiteSetting(key: string): Promise<SiteSetting | undefined>;
  upsertSiteSetting(key: string, value: string): Promise<SiteSetting>;
  createAdminLog(action: string, details?: string, adminId?: string): Promise<AdminLog>;
  getAdminLogs(limit?: number): Promise<AdminLog[]>;
  getFeaturedContent(): Promise<FeaturedContent[]>;
  createFeaturedContent(data: InsertFeaturedContent): Promise<FeaturedContent>;
  updateFeaturedContent(id: string, data: Partial<InsertFeaturedContent>): Promise<FeaturedContent | undefined>;
  deleteFeaturedContent(id: string): Promise<void>;
  getContentReports(): Promise<ContentReport[]>;
  createContentReport(data: InsertContentReport): Promise<ContentReport>;
  updateContentReportStatus(id: string, status: string): Promise<ContentReport | undefined>;
  getWatchlistItems(sessionId: string): Promise<WatchlistItem[]>;
  addToWatchlist(data: InsertWatchlistItem): Promise<WatchlistItem>;
  removeFromWatchlist(sessionId: string, subjectId: string): Promise<void>;
  getAllWatchlistItems(): Promise<WatchlistItem[]>;
  recordAnalyticsEvent(event: string, subjectId?: string, title?: string, sessionId?: string): Promise<void>;
  getAnalyticsStats(): Promise<{ totalViews: number; topContent: Array<{ subjectId: string; title: string; views: number }> }>;
  getBroadcastMessages(): Promise<BroadcastMessage[]>;
  getActiveBroadcastMessage(): Promise<BroadcastMessage | undefined>;
  createBroadcastMessage(data: InsertBroadcastMessage): Promise<BroadcastMessage>;
  updateBroadcastMessage(id: string, data: Partial<InsertBroadcastMessage>): Promise<BroadcastMessage | undefined>;
  deleteBroadcastMessage(id: string): Promise<void>;
  getApiKeys(): Promise<ApiKey[]>;
  getApiKeyByKey(key: string): Promise<ApiKey | undefined>;
  createApiKey(data: InsertApiKey): Promise<ApiKey>;
  updateApiKey(id: string, data: Partial<InsertApiKey>): Promise<ApiKey | undefined>;
  deleteApiKey(id: string): Promise<void>;
  incrementApiKeyUsage(id: string): Promise<void>;
  getAppKeys(): Promise<AppKey[]>;
  getAppKeyByKey(key: string): Promise<AppKey | undefined>;
  createAppKey(data: InsertAppKey): Promise<AppKey>;
  updateAppKey(id: string, data: Partial<InsertAppKey>): Promise<AppKey | undefined>;
  deleteAppKey(id: string): Promise<void>;
  incrementAppKeyUsage(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getAdminUser(username: string): Promise<AdminUser | undefined> {
    const [user] = await db.select().from(adminUsers).where(eq(adminUsers.username, username));
    return user;
  }

  async createAdminUser(data: InsertAdminUser): Promise<AdminUser> {
    const [user] = await db.insert(adminUsers).values(data).returning();
    return user;
  }

  async getNotifications(): Promise<Notification[]> {
    return db.select().from(notifications).orderBy(desc(notifications.createdAt));
  }

  async createNotification(data: InsertNotification): Promise<Notification> {
    const [item] = await db.insert(notifications).values(data).returning();
    return item;
  }

  async updateNotification(id: string, data: Partial<InsertNotification>): Promise<Notification | undefined> {
    const [item] = await db.update(notifications).set(data).where(eq(notifications.id, id)).returning();
    return item;
  }

  async deleteNotification(id: string): Promise<void> {
    await db.delete(notifications).where(eq(notifications.id, id));
  }

  async getAnnouncements(): Promise<Announcement[]> {
    return db.select().from(announcements).orderBy(desc(announcements.isPinned), desc(announcements.createdAt));
  }

  async createAnnouncement(data: InsertAnnouncement): Promise<Announcement> {
    const [item] = await db.insert(announcements).values(data).returning();
    return item;
  }

  async updateAnnouncement(id: string, data: Partial<InsertAnnouncement>): Promise<Announcement | undefined> {
    const [item] = await db.update(announcements).set(data).where(eq(announcements.id, id)).returning();
    return item;
  }

  async deleteAnnouncement(id: string): Promise<void> {
    await db.delete(announcements).where(eq(announcements.id, id));
  }

  async getSiteSettings(): Promise<SiteSetting[]> {
    return db.select().from(siteSettings);
  }

  async getSiteSetting(key: string): Promise<SiteSetting | undefined> {
    const [item] = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
    return item;
  }

  async upsertSiteSetting(key: string, value: string): Promise<SiteSetting> {
    const existing = await this.getSiteSetting(key);
    if (existing) {
      const [item] = await db.update(siteSettings).set({ value, updatedAt: new Date() }).where(eq(siteSettings.key, key)).returning();
      return item;
    } else {
      const [item] = await db.insert(siteSettings).values({ key, value }).returning();
      return item;
    }
  }

  async createAdminLog(action: string, details?: string, adminId?: string): Promise<AdminLog> {
    const [item] = await db.insert(adminLogs).values({ action, details, adminId }).returning();
    return item;
  }

  async getAdminLogs(limit = 100): Promise<AdminLog[]> {
    return db.select().from(adminLogs).orderBy(desc(adminLogs.createdAt)).limit(limit);
  }

  async getFeaturedContent(): Promise<FeaturedContent[]> {
    return db.select().from(featuredContent).orderBy(featuredContent.sortOrder);
  }

  async createFeaturedContent(data: InsertFeaturedContent): Promise<FeaturedContent> {
    const [item] = await db.insert(featuredContent).values(data).returning();
    return item;
  }

  async updateFeaturedContent(id: string, data: Partial<InsertFeaturedContent>): Promise<FeaturedContent | undefined> {
    const [item] = await db.update(featuredContent).set(data).where(eq(featuredContent.id, id)).returning();
    return item;
  }

  async deleteFeaturedContent(id: string): Promise<void> {
    await db.delete(featuredContent).where(eq(featuredContent.id, id));
  }

  async getContentReports(): Promise<ContentReport[]> {
    return db.select().from(contentReports).orderBy(desc(contentReports.createdAt));
  }

  async createContentReport(data: InsertContentReport): Promise<ContentReport> {
    const [item] = await db.insert(contentReports).values(data).returning();
    return item;
  }

  async updateContentReportStatus(id: string, status: string): Promise<ContentReport | undefined> {
    const [item] = await db.update(contentReports).set({ status }).where(eq(contentReports.id, id)).returning();
    return item;
  }

  async getWatchlistItems(sessionId: string): Promise<WatchlistItem[]> {
    return db.select().from(watchlistItems).where(eq(watchlistItems.sessionId, sessionId)).orderBy(desc(watchlistItems.addedAt));
  }

  async addToWatchlist(data: InsertWatchlistItem): Promise<WatchlistItem> {
    const existing = await db.select().from(watchlistItems)
      .where(and(eq(watchlistItems.sessionId, data.sessionId), eq(watchlistItems.subjectId, data.subjectId)));
    if (existing.length > 0) return existing[0];
    const [item] = await db.insert(watchlistItems).values(data).returning();
    return item;
  }

  async removeFromWatchlist(sessionId: string, subjectId: string): Promise<void> {
    await db.delete(watchlistItems)
      .where(and(eq(watchlistItems.sessionId, sessionId), eq(watchlistItems.subjectId, subjectId)));
  }

  async getAllWatchlistItems(): Promise<WatchlistItem[]> {
    return db.select().from(watchlistItems).orderBy(desc(watchlistItems.addedAt));
  }

  async recordAnalyticsEvent(event: string, subjectId?: string, title?: string, sessionId?: string): Promise<void> {
    await db.insert(analyticsEvents).values({ event, subjectId, title, sessionId });
  }

  async getAnalyticsStats(): Promise<{ totalViews: number; topContent: Array<{ subjectId: string; title: string; views: number }> }> {
    const totalResult = await db.select({ count: sql<number>`count(*)` }).from(analyticsEvents).where(eq(analyticsEvents.event, "view"));
    const totalViews = Number(totalResult[0]?.count || 0);

    const topResult = await db.select({
      subjectId: analyticsEvents.subjectId,
      title: analyticsEvents.title,
      views: sql<number>`count(*)`
    }).from(analyticsEvents)
      .where(eq(analyticsEvents.event, "view"))
      .groupBy(analyticsEvents.subjectId, analyticsEvents.title)
      .orderBy(desc(sql`count(*)`))
      .limit(10);

    return {
      totalViews,
      topContent: topResult.map(r => ({
        subjectId: r.subjectId || "",
        title: r.title || "Unknown",
        views: Number(r.views)
      }))
    };
  }

  async getBroadcastMessages(): Promise<BroadcastMessage[]> {
    return db.select().from(broadcastMessages).orderBy(desc(broadcastMessages.createdAt));
  }

  async getActiveBroadcastMessage(): Promise<BroadcastMessage | undefined> {
    const [item] = await db.select().from(broadcastMessages)
      .where(eq(broadcastMessages.isActive, true))
      .orderBy(desc(broadcastMessages.createdAt))
      .limit(1);
    return item;
  }

  async createBroadcastMessage(data: InsertBroadcastMessage): Promise<BroadcastMessage> {
    const [item] = await db.insert(broadcastMessages).values(data).returning();
    return item;
  }

  async updateBroadcastMessage(id: string, data: Partial<InsertBroadcastMessage>): Promise<BroadcastMessage | undefined> {
    const [item] = await db.update(broadcastMessages).set(data).where(eq(broadcastMessages.id, id)).returning();
    return item;
  }

  async deleteBroadcastMessage(id: string): Promise<void> {
    await db.delete(broadcastMessages).where(eq(broadcastMessages.id, id));
  }

  async getApiKeys(): Promise<ApiKey[]> {
    return db.select().from(apiKeys).orderBy(desc(apiKeys.createdAt));
  }

  async getApiKeyByKey(key: string): Promise<ApiKey | undefined> {
    const [item] = await db.select().from(apiKeys).where(eq(apiKeys.key, key));
    return item;
  }

  async createApiKey(data: InsertApiKey): Promise<ApiKey> {
    const [item] = await db.insert(apiKeys).values(data).returning();
    return item;
  }

  async updateApiKey(id: string, data: Partial<InsertApiKey>): Promise<ApiKey | undefined> {
    const [item] = await db.update(apiKeys).set(data).where(eq(apiKeys.id, id)).returning();
    return item;
  }

  async deleteApiKey(id: string): Promise<void> {
    await db.delete(apiKeys).where(eq(apiKeys.id, id));
  }

  async incrementApiKeyUsage(id: string): Promise<void> {
    await db.update(apiKeys).set({ requestCount: sql`${apiKeys.requestCount} + 1` }).where(eq(apiKeys.id, id));
  }

  async getAppKeys(): Promise<AppKey[]> {
    return db.select().from(appKeys).orderBy(desc(appKeys.createdAt));
  }

  async getAppKeyByKey(key: string): Promise<AppKey | undefined> {
    const [item] = await db.select().from(appKeys).where(eq(appKeys.key, key));
    return item;
  }

  async createAppKey(data: InsertAppKey): Promise<AppKey> {
    const [item] = await db.insert(appKeys).values(data).returning();
    return item;
  }

  async updateAppKey(id: string, data: Partial<InsertAppKey>): Promise<AppKey | undefined> {
    const [item] = await db.update(appKeys).set(data).where(eq(appKeys.id, id)).returning();
    return item;
  }

  async deleteAppKey(id: string): Promise<void> {
    await db.delete(appKeys).where(eq(appKeys.id, id));
  }

  async incrementAppKeyUsage(id: string): Promise<void> {
    await db.update(appKeys).set({
      requestCount: sql`${appKeys.requestCount} + 1`,
      lastUsed: new Date(),
    }).where(eq(appKeys.id, id));
  }
}

export const storage = new DatabaseStorage();
