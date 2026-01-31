import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sql } from "drizzle-orm";

// === TABLE DEFINITIONS ===
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  replitId: text("replit_id").unique(), // For Replit Auth
  discordId: text("discord_id").unique(), // For future Discord integration
  username: text("username").notNull(),
  avatar: text("avatar"),
  roles: jsonb("roles").$type<string[]>().default(["member"]),
  bio: text("bio"),
  isAdmin: boolean("is_admin").default(false),
  isStaff: boolean("is_staff").default(false),
  isCreator: boolean("is_creator").default(false),
  trackingEnabled: boolean("tracking_enabled").default(false),
  discordAccessToken: text("discord_access_token"),
});

export const stickers = pgTable("stickers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  image: text("image").notNull(), // URL or asset path
  price: integer("price").default(0), // Value in tickets or whatever currency
  trend: text("trend").default("stable"), // stable, rising, falling
  demand: integer("demand").default(5), // 0-10 scale
  status: text("status").default("stable"), // overpay, stable, underpay
  category: text("category").default("common"),
});

export const staffProfiles = pgTable("staff_profiles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  roleLabel: text("role_label").notNull(), // e.g. "Moderator", "Admin"
  socialLinks: jsonb("social_links").$type<{ discord?: string, roblox?: string, youtube?: string }>().default({}),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  staffProfileId: integer("staff_profile_id").references(() => staffProfiles.id).notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
});

export const promotionalCodes = pgTable("promotional_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  reward: jsonb("reward").$type<string[]>().notNull(),
  description: text("description").notNull(),
  status: text("status").$type<"active" | "expired">().default("active").notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
});

// YouTube Integration
export const youtubeChannels = pgTable("youtube_channels", {
  id: serial("id").primaryKey(),
  channelId: text("channel_id").notNull().unique(),
  title: text("title").notNull(),
  thumbnail: text("thumbnail"),
  addedBy: integer("added_by").references(() => users.id),
});

export const youtubeVideos = pgTable("youtube_videos", {
  id: serial("id").primaryKey(),
  videoId: text("video_id").notNull().unique(),
  channelId: text("channel_id").notNull(),
  title: text("title").notNull(),
  thumbnail: text("thumbnail").notNull(),
  publishedAt: text("published_at").notNull(),
  viewCount: text("view_count"),
  lastFetched: text("last_fetched").default(sql`CURRENT_TIMESTAMP`),
});

// === SCHEMAS ===
export const insertPromotionalCodeSchema = createInsertSchema(promotionalCodes).omit({ id: true, createdAt: true });
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertStickerSchema = createInsertSchema(stickers).omit({ id: true });
export const updateStickerSchema = insertStickerSchema.partial();
export const insertStaffProfileSchema = createInsertSchema(staffProfiles).omit({ id: true });
export const insertCommentSchema = createInsertSchema(comments).omit({ id: true });
export const insertYoutubeChannelSchema = createInsertSchema(youtubeChannels).omit({ id: true });
export const insertYoutubeVideoSchema = createInsertSchema(youtubeVideos).omit({ id: true });

// === TYPES ===
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Sticker = typeof stickers.$inferSelect;
export type InsertSticker = z.infer<typeof insertStickerSchema>;
export type UpdateSticker = z.infer<typeof updateStickerSchema>;

export type StaffProfile = typeof staffProfiles.$inferSelect;
export type InsertStaffProfile = z.infer<typeof insertStaffProfileSchema>;

export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;

export type PromotionalCode = typeof promotionalCodes.$inferSelect;
export type InsertPromotionalCode = z.infer<typeof insertPromotionalCodeSchema>;

export type YoutubeChannel = typeof youtubeChannels.$inferSelect;
export type InsertYoutubeChannel = z.infer<typeof insertYoutubeChannelSchema>;
export type YoutubeVideo = typeof youtubeVideos.$inferSelect;
export type InsertYoutubeVideo = z.infer<typeof insertYoutubeVideoSchema>;

// Joined types
export type CommentWithAuthor = Comment & { author: User };
export type StaffMember = User & { profile?: StaffProfile, comments?: CommentWithAuthor[] };
