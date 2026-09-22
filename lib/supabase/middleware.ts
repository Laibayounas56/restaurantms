import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const { pathname } = request.nextUrl

  // ─── 1. Check Hardcoded Test Session Cookie ───────────────────
  const testRole = request.cookies.get('test_auth_role')?.value

  if (testRole === 'admin') {
    if (pathname === '/login' || pathname === '/') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    if (pathname.startsWith('/waiter')) {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    return supabaseResponse
  }

  if (testRole === 'waiter') {
    if (pathname === '/login' || pathname === '/') {
      return NextResponse.redirect(new URL('/waiter', request.url))
    }
    if (pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/waiter', request.url))
    }
    return supabaseResponse
  }

  // ─── 2. Check Supabase Auth Session ───────────────────────────
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
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data.user
  } catch {
    user = null
  }

  // Allow public routes
  if (pathname === '/login' || pathname === '/') {
    if (user) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile?.role === 'admin') {
          return NextResponse.redirect(new URL('/admin', request.url))
        } else {
          return NextResponse.redirect(new URL('/waiter', request.url))
        }
      } catch {
        return supabaseResponse
      }
    }
    return supabaseResponse
  }

  // Require auth for all other routes
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.is_active) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Role-based route protection
    if (pathname.startsWith('/admin') && profile.role !== 'admin') {
      return NextResponse.redirect(new URL('/waiter', request.url))
    }
    if (pathname.startsWith('/waiter') && profile.role !== 'waiter') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
  } catch {
    // If profile lookup fails, allow user through if authenticated
  }

  return supabaseResponse
}
