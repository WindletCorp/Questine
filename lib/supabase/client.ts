import { createBrowserClient } from '@supabase/ssr'
import { Database } from '../database.types'

// Function to get or create browser client
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}

// Singleton for simpler imports when creating a new instance isn't strictly necessary, 
// though SSR documentation recommends calling createBrowserClient inside components.
export const supabase = createClient()
