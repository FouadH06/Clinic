import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    let supabaseResponse = NextResponse.next({ request })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            )
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options as any)
            )
          },
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const isLoginPage = request.nextUrl.pathname === '/login'

    if (!user && !isLoginPage) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    if (user && isLoginPage) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (error) {
    // Log the actual error so we can debug via Vercel logs
    console.error('[middleware] Error:', error)
    // Don't crash — let the request through
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
