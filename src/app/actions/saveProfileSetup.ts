"use server";

import { createClient } from "@/lib/supabase/server";

export async function saveProfileSetup(username: string, displayName: string) {
  if (!username || !displayName) return { error: "Missing fields" };
  if (username.length < 3) return { error: "Username must be at least 3 characters" };
  
  const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, "");
  if (cleanUsername !== username) return { error: "Invalid username format" };
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { error: "Not authenticated" };
  
  const { error } = await supabase
    .from("profiles")
    .update({ 
      username: cleanUsername, 
      display_name: displayName,
      last_username_update: new Date().toISOString()
    })
    .eq("id", user.id);
    
  if (error) {
    if (error.code === '23505') return { error: "Username is already taken" }; // Unique violation
    console.error("Failed to save profile", error);
    return { error: "Failed to save profile setup" };
  }
  
  return { success: true };
}
