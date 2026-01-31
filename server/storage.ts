import { db } from "./db";
import { 
  users, stickers, staffProfiles, comments, promotionalCodes, youtubeChannels, youtubeVideos, 
  type User, type InsertUser, type Sticker, type InsertSticker, 
  type StaffProfile, type InsertStaffProfile, type Comment, type InsertComment, 
  type CommentWithAuthor, type YoutubeChannel, type InsertYoutubeChannel, 
  type YoutubeVideo, type InsertYoutubeVideo 
} from "@shared/schema";
import { eq, desc, asc } from "drizzle-orm";

export type PromotionalCode = typeof promotionalCodes.$inferSelect;
export type InsertPromotionalCode = typeof promotionalCodes.$inferInsert;

export interface IStorage {
  // User
  getUser(id: number): Promise<User | undefined>;
  getUserByReplitId(replitId: string): Promise<User | undefined>;
  getUserByDiscordId(discordId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User>;
  getUsersWithTracking(): Promise<User[]>;

  // Stickers
  getStickers(filters?: { search?: string, category?: string, trend?: string }): Promise<Sticker[]>;
  getSticker(id: number): Promise<Sticker | undefined>;
  createSticker(sticker: InsertSticker): Promise<Sticker>;
  updateSticker(id: number, sticker: Partial<InsertSticker>): Promise<Sticker>;

  // Promotional Codes
  getPromotionalCodes(): Promise<PromotionalCode[]>;
  createPromotionalCode(code: InsertPromotionalCode): Promise<PromotionalCode>;
  deletePromotionalCode(id: number): Promise<void>;
  updatePromotionalCode(id: number, updates: Partial<InsertPromotionalCode>): Promise<PromotionalCode>;

  // User List for management
  listUsers(): Promise<User[]>;

  // Staff
  getAllStaff(): Promise<(User & { profile: StaffProfile | null, comments: CommentWithAuthor[] })[]>;
  updateStaffProfile(userId: number, profile: InsertStaffProfile): Promise<StaffProfile>;
  
  // Comments
  getComments(staffProfileId: number): Promise<CommentWithAuthor[]>;
  createComment(comment: InsertComment): Promise<CommentWithAuthor>;

  // YouTube
  getYoutubeChannels(): Promise<YoutubeChannel[]>;
  createYoutubeChannel(channel: InsertYoutubeChannel): Promise<YoutubeChannel>;
  deleteYoutubeChannel(channelId: string): Promise<void>;
  getYoutubeVideos(): Promise<YoutubeVideo[]>;
  createYoutubeVideo(video: InsertYoutubeVideo): Promise<void>;
  syncYoutubeVideos(videos: InsertYoutubeVideo[]): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    if (user && user.username === ".meonix") {
      user.isCreator = true;
      user.isAdmin = true;
      user.isStaff = true;
    }
    return user;
  }

  async getUserByReplitId(replitId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.replitId, replitId));
    if (user && user.username === ".meonix") {
      user.isCreator = true;
      user.isAdmin = true;
      user.isStaff = true;
    }
    return user;
  }

  async getUserByDiscordId(discordId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.discordId, discordId));
    if (user && user.username === ".meonix") {
      user.isCreator = true;
      user.isAdmin = true;
      user.isStaff = true;
    }
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser as any).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db.update(users).set(updates as any).where(eq(users.id, id)).returning();
    return user;
  }

  async getUsersWithTracking(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.trackingEnabled, true));
  }

  async getStickers(filters?: { search?: string, category?: string, trend?: string }): Promise<Sticker[]> {
    const all = await db.select().from(stickers).orderBy(desc(stickers.price));
    if (!filters || (!filters.search && !filters.category && !filters.trend)) return all;
    return all.filter(s => {
      if (filters.search && !s.name.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.category && s.category !== filters.category) return false;
      if (filters.trend && s.trend !== filters.trend) return false;
      return true;
    });
  }

  async getSticker(id: number): Promise<Sticker | undefined> {
    const [sticker] = await db.select().from(stickers).where(eq(stickers.id, id));
    return sticker;
  }

  async createSticker(insertSticker: InsertSticker): Promise<Sticker> {
    const [sticker] = await db.insert(stickers).values(insertSticker).returning();
    return sticker;
  }

  async updateSticker(id: number, updates: Partial<InsertSticker>): Promise<Sticker> {
    const [sticker] = await db.update(stickers).set(updates).where(eq(stickers.id, id)).returning();
    return sticker!;
  }

  async getPromotionalCodes(): Promise<PromotionalCode[]> {
    return await db.select().from(promotionalCodes).orderBy(desc(promotionalCodes.id));
  }

  async createPromotionalCode(code: InsertPromotionalCode): Promise<PromotionalCode> {
    const [newCode] = await db.insert(promotionalCodes).values(code).returning();
    return newCode;
  }

  async deletePromotionalCode(id: number): Promise<void> {
    await db.delete(promotionalCodes).where(eq(promotionalCodes.id, id));
  }

  async updatePromotionalCode(id: number, updates: Partial<InsertPromotionalCode>): Promise<PromotionalCode> {
    const [updated] = await db.update(promotionalCodes).set(updates).where(eq(promotionalCodes.id, id)).returning();
    return updated;
  }

  async listUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.id));
  }

  async getAllStaff(): Promise<(User & { profile: StaffProfile | null, comments: CommentWithAuthor[] })[]> {
    const staffUsers = await db.select().from(users).where(eq(users.isStaff, true));
    return await Promise.all(staffUsers.map(async (user) => {
      const [profile] = await db.select().from(staffProfiles).where(eq(staffProfiles.userId, user.id));
      const commentsData = profile ? await this.getComments(profile.id) : [];
      return { ...user, profile: profile || null, comments: commentsData };
    }));
  }

  async updateStaffProfile(userId: number, profile: InsertStaffProfile): Promise<StaffProfile> {
    const [existing] = await db.select().from(staffProfiles).where(eq(staffProfiles.userId, userId));
    if (existing) {
      const [updated] = await db.update(staffProfiles).set(profile as any).where(eq(staffProfiles.userId, userId)).returning();
      return updated;
    }
    const [inserted] = await db.insert(staffProfiles).values(profile as any).returning();
    return inserted;
  }

  async getComments(staffProfileId: number): Promise<CommentWithAuthor[]> {
    const results = await db.select().from(comments).where(eq(comments.staffProfileId, staffProfileId)).orderBy(asc(comments.id));
    return await Promise.all(results.map(async (c) => {
      const author = await this.getUser(c.authorId);
      return { ...c, author: author! };
    }));
  }

  async createComment(insertComment: InsertComment): Promise<CommentWithAuthor> {
    const [comment] = await db.insert(comments).values(insertComment).returning();
    const author = await this.getUser(comment.authorId);
    return { ...comment, author: author! };
  }

  async getYoutubeChannels(): Promise<YoutubeChannel[]> {
    return await db.select().from(youtubeChannels);
  }

  async createYoutubeChannel(channel: InsertYoutubeChannel): Promise<YoutubeChannel> {
    const [newChannel] = await db.insert(youtubeChannels).values(channel).returning();
    return newChannel;
  }

  async deleteYoutubeChannel(channelId: string): Promise<void> {
    await db.delete(youtubeChannels).where(eq(youtubeChannels.channelId, channelId));
    await db.delete(youtubeVideos).where(eq(youtubeVideos.channelId, channelId));
  }

  async getYoutubeVideos(): Promise<YoutubeVideo[]> {
    return await db.select().from(youtubeVideos).orderBy(desc(youtubeVideos.publishedAt));
  }

  async createYoutubeVideo(video: InsertYoutubeVideo): Promise<void> {
    const [existing] = await db.select().from(youtubeVideos).where(eq(youtubeVideos.videoId, video.videoId));
    if (existing) {
      await db.update(youtubeVideos).set(video).where(eq(youtubeVideos.videoId, video.videoId));
    } else {
      await db.insert(youtubeVideos).values(video);
    }
  }

  async syncYoutubeVideos(videos: InsertYoutubeVideo[]): Promise<void> {
    if (videos.length === 0) return;
    for (const video of videos) {
      await this.createYoutubeVideo(video);
    }
  }
}

export const storage = new DatabaseStorage();
