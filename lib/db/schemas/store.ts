import { z } from "zod";

export const themeMetadataSchema = z.object({
  layout: z.string(),
  variables: z.record(z.string(), z.string()),
});

export const personalityMetadataSchema = z.object({
  system_prompt: z.string(),
  tone: z.string(),
  display_name: z.string(),
  avatar_url: z.string().nullable(),
});

export const avatarFrameMetadataSchema = z.object({
  asset_url: z.string(),
  animation: z.string().optional(),
});

export const itemTypeSchema = z.enum(["theme", "personality", "avatar_frame"]);
