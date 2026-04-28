import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that do NOT require authentication
const PUBLIC_ROUTES = ['/login', '/', '/register']

// Routes that each role is allowed to access
const ROLE_ROUTES: Record<string, string> = {
  admin:   '/admin',
  teacher: '/teacher',
  student: '/student',
  parent:  '/parent',
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Create a response that we can modify (for refreshing session cookies)
  let supabaseResponse = NextResponse.next({ request })

  // Create supabase client that can read/write cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not run code between createServerClient and getUser()
  // A stale session may exist — getUser() re-validates with Supabase Auth server
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname)

  // 1. Not authenticated → redirect to /login (except public routes)
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 2. Authenticated user on /login → redirect to their dashboard
  if (user && pathname === '/login') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('roles(name)')
      .eq('id', user.id)
      .single()

    const roleName = (profile?.roles as { name: string } | null)?.name ?? 'student'
    const url = request.nextUrl.clone()
    url.pathname = `/${roleName}`
    return NextResponse.redirect(url)
  }

  // 3. Authenticated user accessing wrong role's dashboard → redirect to theirs
  if (user && !isPublicRoute) {
    // Check if current path starts with a role prefix
    const roleInPath = Object.keys(ROLE_ROUTES).find((role) =>
      pathname.startsWith(`/${role}`)
    )

    if (roleInPath) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('roles(name)')
        .eq('id', user.id)
        .single()

      const actualRole = (profile?.roles as { name: string } | null)?.name ?? 'student'

      // Wrong role trying to access dashboard → redirect
      if (roleInPath !== actualRole) {
        const url = request.nextUrl.clone()
        url.pathname = `/${actualRole}`
        return NextResponse.redirect(url)
      }
    }
  }

  // 4. Root path → redirect authenticated user to their dashboard
  if (user && pathname === '/') {
    const { data: profile } = await supabase
      .from('profiles')
      .select('roles(name)')
      .eq('id', user.id)
      .single()

    const roleName = (profile?.roles as { name: string } | null)?.name ?? 'student'
    const url = request.nextUrl.clone()
    url.pathname = `/${roleName}`
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public files (svg, png, jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
