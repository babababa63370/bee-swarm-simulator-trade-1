import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { insertYoutubeChannelSchema } from "@shared/schema";
import { z } from "zod";
import passport from "passport";
import { Strategy as DiscordStrategy } from "passport-discord";
import session from "express-session";
import pgSession from "connect-pg-simple";
import { pool } from "./db";
import axios from "axios";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const PostgresStore = pgSession(session);

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // === SESSION CONFIG ===
  app.use(
    session({
      store: new PostgresStore({
        pool,
        tableName: "session",
        createTableIfMissing: true,
      }),
      secret: "bss-hub-secret",
      resave: false,
      saveUninitialized: false,
      cookie: { 
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        secure: false, // Set to true if using HTTPS/Production
        sameSite: "lax"
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: any, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (e) {
      done(e);
    }
  });

  if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
    passport.use(
      new DiscordStrategy(
        {
          clientID: process.env.DISCORD_CLIENT_ID,
          clientSecret: process.env.DISCORD_CLIENT_SECRET,
          callbackURL: process.env.DISCORD_REDIRECT_URI,
          scope: ["identify", "email", "guilds", "guilds.join"],
        },
        async (accessToken: string, refreshToken: string, profile: any, done: any) => {
          try {
            let user = await storage.getUserByDiscordId(profile.id);
            if (!user) {
              user = await storage.createUser({
                discordId: profile.id,
                username: profile.username,
                avatar: profile.avatar 
                  ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
                  : `https://ui-avatars.com/api/?name=${profile.username}&background=febc11&color=fff`,
                roles: ["member"],
                isStaff: false,
                isAdmin: false,
                discordAccessToken: accessToken,
              });
            } else {
              await storage.updateUser(user.id, { discordAccessToken: accessToken });
            }
            return done(null, user);
          } catch (e) {
            return done(e as Error);
          }
        }
      )
    );

    app.get("/api/auth/discord", passport.authenticate("discord"));
    app.get(
      "/api/auth/discord/callback",
      passport.authenticate("discord", { failureRedirect: "/login" }),
      (req, res) => res.redirect("/")
    );
    app.post("/api/auth/logout", (req, res, next) => {
      req.logout((err) => {
        if (err) return next(err);
        res.sendStatus(200);
      });
    });
  }

  // === AUTH MIDDLEWARE (LEGACY REPLIT AUTH COMPAT) ===
  app.use(async (req, res, next) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
      (req as any).user = req.user;
      return next();
    }

    const replitId = req.header("x-replit-user-id");
    const replitName = req.header("x-replit-user-name");
    const replitRoles = req.header("x-replit-user-roles");

    if (replitId && replitName) {
      let user = await storage.getUserByReplitId(replitId);
      if (!user) {
        user = await storage.createUser({
          replitId,
          username: replitName,
          roles: replitRoles ? replitRoles.split(",") : ["member"],
          avatar: `https://ui-avatars.com/api/?name=${replitName}&background=febc11&color=fff`,
          isStaff: false,
          isAdmin: false,
        });
      }
      (req as any).user = user;
    }
    next();
  });

  // === ROUTES ===

  // Auth / Me
  app.get(api.auth.me.path, (req, res) => {
    // If middleware worked, (req as any).user should be populated
    const user = (req as any).user || null;
    if (user && user.username === ".meonix") {
      user.isCreator = true;
      user.isAdmin = true;
      user.isStaff = true;
    }
    res.json(user);
  });

  // Stickers List
  app.get(api.stickers.list.path, async (req, res) => {
    try {
      const input = req.query || {};
      console.log("[routes] GET /api/stickers query:", input);
      const stickers = await storage.getStickers(input as any);
      console.log(`[routes] Returning ${stickers.length} stickers`);
      res.json(stickers);
    } catch (e: any) {
      console.error("[routes] Error fetching stickers:", e);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Sticker Get
  app.get(api.stickers.get.path, async (req, res) => {
    const id = Number(req.params.id);
    const sticker = await storage.getSticker(id);
    if (!sticker) return res.status(404).json({ message: "Sticker not found" });
    res.json(sticker);
  });

  // Sticker Create (Admin only - simplified for now)
  app.post(api.stickers.create.path, async (req, res) => {
    try {
      const input = api.stickers.create.input.parse(req.body);
      const sticker = await storage.createSticker(input);
      res.status(201).json(sticker);
    } catch (e) {
       if (e instanceof z.ZodError) {
        return res.status(400).json(e.errors);
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Sticker Update (Staff/Admin only)
  app.patch("/api/stickers/:id", async (req, res) => {
    const user = (req as any).user;
    if (!user || (!user.isStaff && !user.isAdmin)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    try {
      const id = Number(req.params.id);
      const sticker = await storage.updateSticker(id, req.body);
      res.json(sticker);
    } catch (e: any) {
      if (e instanceof z.ZodError) {
        return res.status(400).json(e.errors);
      }
      res.status(500).json({ message: e.message || "Failed to update sticker" });
    }
  });

  // Sticker Update (Staff only)
  app.patch(api.stickers.update.path, async (req, res) => {
    if (!(req as any).user?.isStaff) {
      return res.status(403).json({ message: "Staff only" });
    }
    try {
      const id = Number(req.params.id);
      const input = api.stickers.update.input.parse(req.body);
      const sticker = await storage.updateSticker(id, input);
      res.json(sticker);
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json(e.errors);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Staff List
  app.get(api.staff.list.path, async (req, res) => {
    try {
      const staff = await storage.getAllStaff();
      res.json(staff);
    } catch (e: any) {
      console.error("[routes] Error fetching staff:", e);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update User Bio (Any authenticated user)
  app.patch("/api/user/bio", async (req, res) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const { bio } = req.body;
      const updatedUser = await storage.updateUser(user.id, { bio });
      res.json(updatedUser);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed to update bio" });
    }
  });

  // Update Staff Profile (Staff/Admin)
  app.post("/api/staff/profile", async (req, res) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      // If the user is staff/admin, they can update their staff profile
      if (user.isStaff || user.isAdmin) {
        const profile = await storage.updateStaffProfile(user.id, {
          userId: user.id,
          roleLabel: req.body.roleLabel,
          socialLinks: req.body.socialLinks || {},
        });
        return res.json(profile);
      }
      
      res.status(403).json({ message: "Only staff can update staff profiles" });
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed to update profile" });
    }
  });

  // Create Comment
  app.post("/api/staff/:id/comments", async (req, res) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const staffProfileId = Number(req.params.id);
      const comment = await storage.createComment({
        staffProfileId,
        authorId: user.id,
        content: req.body.content,
      });
      res.status(201).json(comment);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed to add comment" });
    }
  });

  // Stats endpoint
  app.get("/api/stats", async (req, res) => {
    try {
      const stickers = await storage.getStickers();
      // Bee Swarm Simulator Universe ID: 601130232 (based on Place ID 1537690962)
      let playerCount = "15k+";
      try {
        const robloxRes = await fetch("https://games.roblox.com/v1/games?universeIds=601130232");
        const data = (await robloxRes.json()) as any;
        if (data?.data?.[0]?.playing !== undefined) {
          playerCount = data.data[0].playing.toLocaleString();
        }
      } catch (e) {
        console.error("Failed to fetch Roblox stats", e);
      }

      // Fetch Discord Server Stats
      let serverMembers = "TBD";
      try {
        const discordRes = await fetch("https://discord.com/api/v9/invites/GAvUvfVHxx?with_counts=true");
        const discordData = await discordRes.json();
        if (discordData.approximate_member_count) {
          serverMembers = discordData.approximate_member_count.toLocaleString();
        }
      } catch (e) {
        console.error("Failed to fetch Discord stats", e);
      }

      res.json({
        stickerCount: 288,
        playerCount,
        serverMembers
      });
    } catch (e) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Fetch Discord Messages
  app.get("/api/discord/messages/:channelId", async (req, res) => {
    try {
      const { channelId } = req.params;
      const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages?limit=10`, {
        headers: {
          "Authorization": `Bot ${process.env.DISCORD_BOT_TOKEN}`,
        }
      });

      if (!response.ok) {
        const error = await response.json();
        return res.status(response.status).json(error);
      }

      const messages = await response.json();
      res.json(messages);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed to fetch Discord messages" });
    }
  });

  // Tracking endpoint
  app.post("/api/user/tracking", async (req, res) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: "Not authenticated" });
    try {
      const { enabled } = req.body;
      const updatedUser = await storage.updateUser(user.id, { trackingEnabled: enabled });
      res.json(updatedUser);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed to update tracking" });
    }
  });

  // Test Ping Endpoint
  app.post("/api/user/test-ping", async (req, res) => {
    const user = (req as any).user;
    if (!user) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const GUILD_ID = process.env.DISCORD_GUILD_ID;
      if (!GUILD_ID) {
        return res.status(500).json({ message: "DISCORD_GUILD_ID non configuré" });
      }

      if (!user.discordId || !user.discordAccessToken) {
        return res.status(400).json({ message: "Discord non lié ou accès manquant" });
      }

      // Fetch Roblox Group Info
      let groupName = "Roblox Testing Groupe";
      let groupIcon = "";
      try {
        const groupRes = await fetch(`https://groups.roblox.com/v1/groups/${GROUP_ID}`);
        const groupData = await groupRes.json();
        groupName = groupData.name || groupName;
        
        const iconRes = await fetch(`https://thumbnails.roblox.com/v1/groups/icons?groupIds=${GROUP_ID}&size=420x420&format=Png&isCircular=false`);
        const iconData = await iconRes.json();
        groupIcon = iconData.data?.[0]?.imageUrl || "";
      } catch (e) {
        console.error("[test-ping] Failed to fetch Roblox info", e);
      }

      console.log(`[test-ping] Sending test notification to user ${user.username} (${user.discordId})`);
      
      // Attempt 1: Add user to guild
      const joinResponse = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${user.discordId}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bot ${process.env.DISCORD_BOT_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ access_token: user.discordAccessToken })
      });

      // Attempt 2: Send stylized embed in DM
      try {
        const dmChannelRes = await fetch(`https://discord.com/api/v10/users/@me/channels`, {
          method: "POST",
          headers: {
            "Authorization": `Bot ${process.env.DISCORD_BOT_TOKEN}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ recipient_id: user.discordId })
        });
        
        if (dmChannelRes.ok) {
          const channel = await dmChannelRes.json();
          await fetch(`https://discord.com/api/v10/channels/${channel.id}/messages`, {
            method: "POST",
            headers: {
              "Authorization": `Bot ${process.env.DISCORD_BOT_TOKEN}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ 
              embeds: [{
                title: "🔔 BSS Hub Notification Test",
                description: `This is a test to confirm that you will receive tracking alerts for the group **${groupName}**.`,
                color: 0xfebc11, // Honey yellow
                fields: [
                  { name: "User", value: user.username, inline: true },
                  { name: "Status", value: "🟢 Operational", inline: true },
                  { name: "Monitored Group", value: groupName }
                ],
                thumbnail: groupIcon ? { url: groupIcon } : undefined,
                footer: { text: "BSS Hub • Tracking System" },
                timestamp: new Date().toISOString()
              }]
            })
          });
        }
      } catch (dmErr) {
        console.error("[test-ping] DM fallback failed:", dmErr);
      }

      if (!joinResponse.ok && joinResponse.status !== 204 && joinResponse.status !== 201) {
        const errorData = await joinResponse.json();
        console.error("[test-ping] Discord API error:", errorData);
        return res.status(joinResponse.status).json({ message: "Erreur Discord API", detail: errorData });
      }

      res.json({ message: "Test sent successfully! Check your Discord." });
    } catch (e: any) {
      console.error("[test-ping] Error:", e);
      res.status(500).json({ message: e.message || "Failed to send test ping" });
    }
  });

  // Promotional Codes
  app.get("/api/codes", async (req, res) => {
    try {
      const codes = await storage.getPromotionalCodes();
      res.json(codes);
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch codes" });
    }
  });

  app.post("/api/codes", async (req, res) => {
    const user = (req as any).user;
    if (!user?.isAdmin) return res.status(403).json({ message: "Admin only" });
    try {
      const newCode = await storage.createPromotionalCode(req.body);
      res.status(201).json(newCode);
    } catch (e) {
      res.status(500).json({ message: "Failed to create code" });
    }
  });

  app.delete("/api/codes/:id", async (req, res) => {
    const user = (req as any).user;
    if (!user?.isAdmin) return res.status(403).json({ message: "Admin only" });
    try {
      await storage.deletePromotionalCode(Number(req.params.id));
      res.sendStatus(204);
    } catch (e) {
      res.status(500).json({ message: "Failed to delete code" });
    }
  });

  app.patch("/api/codes/:id", async (req, res) => {
    const user = (req as any).user;
    if (!user?.isAdmin) return res.status(403).json({ message: "Admin only" });
    try {
      const updatedCode = await storage.updatePromotionalCode(Number(req.params.id), req.body);
      res.json(updatedCode);
    } catch (e) {
      res.status(500).json({ message: "Failed to update code" });
    }
  });

  // User Management for Creator
  app.get("/api/admin/users", async (req, res) => {
    const user = (req as any).user;
    if (!user?.isCreator) return res.status(403).json({ message: "Creator only" });
    try {
      const users = await storage.listUsers();
      res.json(users);
    } catch (e) {
      res.status(500).json({ message: "Failed to list users" });
    }
  });

  app.patch("/api/admin/users/:id/role", async (req, res) => {
    const user = (req as any).user;
    if (!user?.isCreator) return res.status(403).json({ message: "Creator only" });
    try {
      const targetId = Number(req.params.id);
      const updates = req.body; // { isAdmin: boolean, isStaff: boolean, isCreator: boolean }
      
      // Only .meonix can promote others to Creator
      if (updates.isCreator !== undefined && user.username !== ".meonix") {
        return res.status(403).json({ message: "Only the main Creator can promote others to Creator" });
      }

      const updatedUser = await storage.updateUser(targetId, updates);
      res.json(updatedUser);
    } catch (e) {
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.get("/api/youtube/channels", async (_req, res) => {
    try {
      const channels = await storage.getYoutubeChannels();
      res.json(channels);
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch channels" });
    }
  });

  app.post("/api/youtube/channels", async (req, res) => {
    const user = (req as any).user;
    if (!user?.isCreator) return res.status(403).json({ message: "Creator only" });
    try {
      const data = insertYoutubeChannelSchema.parse(req.body);
      
      // Fetch channel details from YouTube API if key is available
      if (YOUTUBE_API_KEY) {
        try {
          const response = await axios.get("https://www.googleapis.com/youtube/v3/channels", {
            params: {
              part: "snippet,statistics",
              id: data.channelId.startsWith("@") ? undefined : data.channelId,
              forHandle: data.channelId.startsWith("@") ? data.channelId : undefined,
              key: YOUTUBE_API_KEY
            }
          });

          if (response.data.items?.[0]) {
            const channelData = response.data.items[0];
            data.title = channelData.snippet.title;
            data.thumbnail = channelData.snippet.thumbnails.default.url;
          }
        } catch (error) {
          console.error("YouTube API Error:", error);
        }
      }

      const newChannel = await storage.createYoutubeChannel({
        ...data,
        addedBy: user.id
      });

      // Initial sync
      if (YOUTUBE_API_KEY) {
        try {
          const videoResponse = await axios.get("https://www.googleapis.com/youtube/v3/search", {
            params: {
              part: "snippet",
              channelId: data.channelId.startsWith("@") ? undefined : data.channelId,
              forHandle: data.channelId.startsWith("@") ? data.channelId : undefined,
              maxResults: 10,
              order: "date",
              type: "video",
              key: YOUTUBE_API_KEY
            }
          });

          if (videoResponse.data.items) {
            const videos = videoResponse.data.items.map((item: any) => ({
              channelId: data.channelId,
              videoId: item.id.videoId,
              title: item.snippet.title,
              thumbnail: item.snippet.thumbnails.high.url,
              publishedAt: item.snippet.publishedAt,
              viewCount: "0"
            }));

            for (const video of videos) {
              await storage.createYoutubeVideo(video);
            }
          }
        } catch (error) {
          console.error("YouTube Sync Error:", error);
        }
      }

      res.status(201).json(newChannel);
    } catch (e) {
      console.error("Add channel error:", e);
      res.status(500).json({ message: "Failed to add channel" });
    }
  });

  app.delete("/api/youtube/channels/:channelId", async (req, res) => {
    const user = (req as any).user;
    if (!user?.isCreator) return res.status(403).json({ message: "Creator only" });
    try {
      await storage.deleteYoutubeChannel(req.params.channelId);
      res.sendStatus(204);
    } catch (e) {
      res.status(500).json({ message: "Failed to remove channel" });
    }
  });

  app.get("/api/youtube/videos", async (_req, res) => {
    try {
      const videos = await storage.getYoutubeVideos();
      res.json(videos);
    } catch (e) {
      res.status(500).json({ message: "Failed to fetch videos" });
    }
  });

  app.post("/api/youtube/sync", async (req, res) => {
    const user = (req as any).user;
    if (!user?.isCreator) return res.status(403).json({ message: "Creator only" });
    
    if (!YOUTUBE_API_KEY) {
      return res.status(400).send("YouTube API Key not configured");
    }

    try {
      const channels = await storage.getYoutubeChannels();
      for (const channel of channels) {
        try {
          const response = await axios.get("https://www.googleapis.com/youtube/v3/search", {
            params: {
              part: "snippet",
              channelId: channel.channelId.startsWith("@") ? undefined : channel.channelId,
              forHandle: channel.channelId.startsWith("@") ? channel.channelId : undefined,
              maxResults: 10,
              order: "date",
              type: "video",
              key: YOUTUBE_API_KEY
            }
          });

          if (response.data.items) {
            const videos = response.data.items.map((item: any) => ({
              channelId: channel.channelId,
              videoId: item.id.videoId,
              title: item.snippet.title,
              thumbnail: item.snippet.thumbnails.high.url,
              publishedAt: item.snippet.publishedAt,
              viewCount: "0"
            }));

            for (const video of videos) {
              await storage.createYoutubeVideo(video);
            }
          }
        } catch (error) {
          console.error(`Sync error for ${channel.channelId}:`, error);
        }
      }
      res.sendStatus(200);
    } catch (e) {
      res.status(500).json({ message: "Failed to sync videos" });
    }
  });

  // Background Roblox Group Tracking
  const GROUP_ID = "5211428";
  let lastMemberCount = 0;

  async function checkGroupTracking() {
    try {
      // Fetch Roblox Group Info for the embed
      let groupName = "Roblox Testing Groupe";
      let groupIcon = "";
      try {
        const groupRes = await fetch(`https://groups.roblox.com/v1/groups/${GROUP_ID}`);
        const groupData = await groupRes.json();
        groupName = groupData.name || groupName;
        
        const iconRes = await fetch(`https://thumbnails.roblox.com/v1/groups/icons?groupIds=${GROUP_ID}&size=420x420&format=Png&isCircular=false`);
        const iconData = await iconRes.json();
        groupIcon = iconData.data?.[0]?.imageUrl || "";
      } catch (e) {
        console.error("[tracking] Failed to fetch Roblox info", e);
      }

      const robloxRes = await fetch(`https://groups.roblox.com/v1/groups/${GROUP_ID}`);
      const data = (await robloxRes.json()) as any;
      const currentCount = data.memberCount;

      if (lastMemberCount > 0 && currentCount > lastMemberCount) {
        const usersToNotify = await storage.getUsersWithTracking();
        for (const user of usersToNotify) {
          if (user.discordId && user.discordAccessToken) {
            console.log(`[tracking] Notifying user ${user.username} (${user.discordId})`);
            
            const GUILD_ID = process.env.DISCORD_GUILD_ID;
            if (GUILD_ID) {
              try {
                // Join guild
                await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${user.discordId}`, {
                  method: "PUT",
                  headers: {
                    "Authorization": `Bot ${process.env.DISCORD_BOT_TOKEN}`,
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify({ access_token: user.discordAccessToken })
                });

                // Send Stylized DM
                const dmChannelRes = await fetch(`https://discord.com/api/v10/users/@me/channels`, {
                  method: "POST",
                  headers: {
                    "Authorization": `Bot ${process.env.DISCORD_BOT_TOKEN}`,
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify({ recipient_id: user.discordId })
                });
                
                if (dmChannelRes.ok) {
                  const channel = await dmChannelRes.json();
                  await fetch(`https://discord.com/api/v10/channels/${channel.id}/messages`, {
                    method: "POST",
                    headers: {
                      "Authorization": `Bot ${process.env.DISCORD_BOT_TOKEN}`,
                      "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ 
                      embeds: [{
                        title: "🚀 New member accepted!",
                        description: `A new member has been accepted into the group **${groupName}**!`,
                        color: 0xfebc11,
                        fields: [
                          { name: "Group", value: groupName, inline: true },
                          { name: "Total Members", value: currentCount.toString(), inline: true }
                        ],
                        thumbnail: groupIcon ? { url: groupIcon } : undefined,
                        footer: { text: "BSS Hub • Real-Time Alerts" },
                        timestamp: new Date().toISOString()
                      }]
                    })
                  });
                }
              } catch (e) {
                console.error(`Failed to notify user ${user.username}`, e);
              }
            }
          }
        }
      }
      lastMemberCount = currentCount;
    } catch (e) {
      console.error("[tracking] Error checking group:", e);
    }
  }

  setInterval(checkGroupTracking, 60000); // Check every minute

  return httpServer;
}

async function seedDatabase() {
  const stickers = await storage.getStickers();
  if (stickers.length === 0) {
    console.log("Seeding database...");
    
    // Stickers
    const seedStickers = [
      { name: "Star Sign", image: "https://vignette.wikia.nocookie.net/bee-swarm-simulator/images/a/a2/Star_Sign_Sticker.png", price: 5000, trend: "rising", description: "A rare celestial sticker.", category: "mythic" },
      { name: "Stick Nymph", image: "https://vignette.wikia.nocookie.net/bee-swarm-simulator/images/e/e4/Stick_Nymph_Sticker.png", price: 2500, trend: "stable", description: "A friendly stick bug.", category: "legendary" },
      { name: "Simple Sun", image: "https://vignette.wikia.nocookie.net/bee-swarm-simulator/images/b/b3/Simple_Sun_Sticker.png", price: 100, trend: "stable", description: "Bright and sunny.", category: "common" },
      { name: "Rubber Duck", image: "https://vignette.wikia.nocookie.net/bee-swarm-simulator/images/3/3d/Rubber_Duck_Sticker.png", price: 50, trend: "falling", description: "Quack.", category: "common" },
      { name: "Traffic Cone", image: "https://vignette.wikia.nocookie.net/bee-swarm-simulator/images/c/c3/Traffic_Cone_Sticker.png", price: 75, trend: "stable", description: "Safety first.", category: "uncommon" },
      { name: "Diamond Bee", image: "https://vignette.wikia.nocookie.net/bee-swarm-simulator/images/d/d4/Diamond_Bee_Sticker.png", price: 1200, trend: "rising", description: "A shiny diamond bee.", category: "legendary" },
      { name: "Tabby Bee", image: "https://vignette.wikia.nocookie.net/bee-swarm-simulator/images/0/07/Tabby_Bee_Sticker.png", price: 1500, trend: "stable", description: "Always hungry.", category: "event" },
      { name: "Gummy Bear", image: "https://vignette.wikia.nocookie.net/bee-swarm-simulator/images/0/0a/Gummy_Bear_Sticker.png", price: 3000, trend: "rising", description: "Sweet but sticky.", category: "mythic" },
      { name: "Festive Bee", image: "https://vignette.wikia.nocookie.net/bee-swarm-simulator/images/1/1a/Festive_Bee_Sticker.png", price: 800, trend: "falling", description: "Happy Holidays!", category: "event" },
      { name: "Golden Rake", image: "https://vignette.wikia.nocookie.net/bee-swarm-simulator/images/4/4b/Golden_Rake_Sticker.png", price: 200, trend: "stable", description: "Shiny tool.", category: "rare" },
    ];

    for (const s of seedStickers) {
      await storage.createSticker(s);
    }

    // Check if the specific admin user exists
    const adminDiscordId = "1243206708604702791";
    let admin = await storage.getUserByDiscordId(adminDiscordId);
    if (!admin) {
      // Create the user if they don't exist yet (will be updated when they first login)
      admin = await storage.createUser({
        username: "Admin",
        discordId: adminDiscordId,
        roles: ["admin", "moderator"],
        isStaff: true,
        isAdmin: true,
        avatar: "https://ui-avatars.com/api/?name=Admin&background=8B4513&color=fff",
        bio: "Hub Administrator"
      });
    } else {
      // Update existing user
      await storage.updateUser(admin.id, {
        isStaff: true,
        isAdmin: true,
        roles: ["admin", "moderator"]
      });
    }
    
    // Wait for DB to handle foreign key constraint if needed (but drizzle creates tables sequentially usually?)
    // Actually we need to insert profile manually
    // Since we don't have a storage method for createProfile, let's just leave it for now or implement it if I added it to schema.
    // I added staffProfiles table but didn't add createStaffProfile method. 
    // It's fine, the `getAllStaff` returns null profile if not found.
  }
}
