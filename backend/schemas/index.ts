import { z } from "zod";

// Common schemas
export const uuidSchema = z.string().uuid();
export const timestampSchema = z.string().datetime({ offset: true });
export const timezoneSchema = z.string().min(1).max(50);

// Visibility enum
export const visibilitySchema = z.enum(["private", "public"]);

// Unit system enum
export const unitSystemSchema = z.enum(["metric", "imperial"]);

// Update user profile schema
export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens")
    .optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional(),
  timezone: timezoneSchema.optional(),
  unitSystem: unitSystemSchema.optional(),
  isPublic: z.boolean().optional(),
});

// Update user settings schema
export const updateSettingsSchema = z.object({
  distanceUnit: z.enum(["km", "mi"]).optional(),
  paceUnit: z.enum(["min/km", "min/mi"]).optional(),
  weekStartsOn: z.enum(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]).optional(),
  defaultRunVisibility: visibilitySchema.optional(),
  notificationsEnabled: z.boolean().optional(),
});

// Query parameters
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const runQuerySchema = paginationSchema.extend({
  from: timestampSchema.optional(),
  to: timestampSchema.optional(),
  sort: z.enum(["asc", "desc"]).default("desc"),
});

export const contributionQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
});

// Type exports
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
export type RunQuery = z.infer<typeof runQuerySchema>;
export type ContributionQuery = z.infer<typeof contributionQuerySchema>;
