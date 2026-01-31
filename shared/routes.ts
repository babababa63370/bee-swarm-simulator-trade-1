import { z } from 'zod';
import { insertUserSchema, insertStickerSchema, insertStaffProfileSchema, users, stickers, staffProfiles } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  auth: {
    me: {
      method: 'GET' as const,
      path: '/api/auth/me',
      responses: {
        200: z.custom<typeof users.$inferSelect>().nullable(),
      },
    },
  },
  users: {
    update: {
      method: 'PATCH' as const,
      path: '/api/users/:id',
      input: insertUserSchema.partial(),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
  },
  stickers: {
    list: {
      method: 'GET' as const,
      path: '/api/stickers',
      input: z.object({
        search: z.string().optional(),
        category: z.string().optional(),
        trend: z.string().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof stickers.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/stickers/:id',
      responses: {
        200: z.custom<typeof stickers.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/stickers',
      input: insertStickerSchema,
      responses: {
        201: z.custom<typeof stickers.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/stickers/:id',
      input: insertStickerSchema.partial(),
      responses: {
        200: z.custom<typeof stickers.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      },
    },
  },
  staff: {
    list: {
      method: 'GET' as const,
      path: '/api/staff',
      responses: {
        200: z.array(z.custom<typeof users.$inferSelect & { profile: typeof staffProfiles.$inferSelect | null }>()),
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
