import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch (error) {
    console.warn("Middleware auth check failed (network/DNS issue):", error);
  }

  // Define public paths that do not require authentication
  const isAuthPage = request.nextUrl.pathname.startsWith('/auth')
  const isApi = request.nextUrl.pathname.startsWith('/api')
  const isStaticFile = request.nextUrl.pathname.includes('.')
  
  // Routes that should be accessible without logging in
  const isPublicRoute = request.nextUrl.pathname === '/' || request.nextUrl.pathname === '/onboarding'

  // Protect all internal routes
  if (!user && !isAuthPage && !isApi && !isStaticFile && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages back to home
  // (Skip this if it's a Server Action, otherwise the POST request will be redirected and fail)
  const isServerAction = request.headers.has('next-action');
<<<<<<< HEAD
  if (user && isAuthPage && !isServerAction) {
=======
  const isSetupProfile = request.nextUrl.pathname.startsWith('/auth/setup-profile');
  
  if (user && isAuthPage && !isServerAction && !isSetupProfile) {
>>>>>>> public-release
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
