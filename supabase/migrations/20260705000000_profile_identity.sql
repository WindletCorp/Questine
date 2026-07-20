-- Add display_name and last_username_update to profiles

ALTER TABLE "public"."profiles" 
ADD COLUMN IF NOT EXISTS "display_name" text,
ADD COLUMN IF NOT EXISTS "last_username_update" timestamp with time zone;
