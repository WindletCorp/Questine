import { createClient } from '@supabase/supabase-js'
import { createGoogleGenerativeAI } from '@ai-sdk/google'
import { AI_MODEL } from '@/lib/ai/config'

export async function getAuthenticatedAIProvider(req: Request) {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return { errorResponse: new Response('Unauthorized - Missing Authorization header', { status: 401 }) }
  }
  const token = authHeader.replace('Bearer ', '')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } }
    }
  )

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  
  if (authError || !user) {
    return { errorResponse: new Response('Unauthorized - Invalid token', { status: 401 }) }
  }

  const { data: userData, error: dbError } = await supabase
    .from('users')
    .select('byok_key, goals, constraints')
    .eq('id', user.id)
    .single()

  if (dbError || !userData?.byok_key) {
    return { errorResponse: new Response('API Key not found for user. Please set your BYOK key.', { status: 400 }) }
  }

  const google = createGoogleGenerativeAI({ apiKey: userData.byok_key })
  const provider = google(AI_MODEL)

  const now = new Date()
  const currentTime = now.toLocaleString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  })

  return { 
    provider, 
    user, 
    supabase,
    goals: userData.goals, 
    constraints: userData.constraints,
    currentTime
  }
}
