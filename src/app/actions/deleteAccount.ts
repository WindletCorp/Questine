"use server";

import { createClient } from "@/lib/supabase/server";

export async function deleteAccount() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Must be logged in to delete account");
  }

  // Call the secure RPC function to delete the user
  const { error } = await supabase.rpc('delete_user');
  
  if (error) {
    throw new Error(`Failed to delete account: ${error.message}`);
  }

  // Sign out
  await supabase.auth.signOut();
  
  return { success: true };
}
