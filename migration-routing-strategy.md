# Role-Based Routing Migration Strategy

## Current Structure → Next.js Structure

### Current HTML Files → Next.js Pages
```
Current Structure:
├── index.html                 → pages/index.tsx (Landing)
├── student-dashboard.html     → pages/student/dashboard.tsx
├── tutor-dashboard.html       → pages/tutor/dashboard.tsx
├── findteacher.html           → pages/tutors/index.tsx
├── profile.html               → pages/tutors/[id].tsx
├── become-tutor.html          → pages/tutor/apply.tsx
├── student-messages.html      → pages/student/messages.tsx
├── tutor-messages.html        → pages/tutor/messages.tsx
```

### Authentication Middleware (middleware.ts)
```typescript
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  const { data: { session } } = await supabase.auth.getSession()
  
  // Protect authenticated routes
  if (req.nextUrl.pathname.startsWith('/student') || 
      req.nextUrl.pathname.startsWith('/tutor')) {
    
    if (!session) {
      return NextResponse.redirect(new URL('/', req.url))
    }
    
    // Get user role from database
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()
    
    // Role-based access control
    if (req.nextUrl.pathname.startsWith('/student') && profile?.role !== 'student') {
      return NextResponse.redirect(new URL('/tutor/dashboard', req.url))
    }
    
    if (req.nextUrl.pathname.startsWith('/tutor') && profile?.role !== 'tutor') {
      return NextResponse.redirect(new URL('/student/dashboard', req.url))
    }
  }
  
  return res
}

export const config = {
  matcher: ['/student/:path*', '/tutor/:path*']
}
```

### Authentication Hook
```typescript
// hooks/useAuth.ts
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useEffect, useState } from 'react'

export function useAuth() {
  const user = useUser()
  const supabase = useSupabaseClient()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchProfile()
    } else {
      setLoading(false)
    }
  }, [user])

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    
    setProfile(data)
    setLoading(false)
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return {
    user,
    profile,
    loading,
    signOut,
    isStudent: profile?.role === 'student',
    isTutor: profile?.role === 'tutor'
  }
}
```

## Component Structure Migration

### Current: Inline JavaScript → React Components
```typescript
// Current: student-dashboard.html with inline JS
<script>
  function loadLessons() {
    // Fetch lessons logic
  }
</script>

// Next.js: Proper React component
// components/StudentDashboard.tsx
import { useEffect, useState } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'

export default function StudentDashboard() {
  const [lessons, setLessons] = useState([])
  const supabase = useSupabaseClient()

  useEffect(() => {
    loadLessons()
  }, [])

  const loadLessons = async () => {
    const { data } = await supabase
      .from('lessons')
      .select('*')
      .eq('student_id', user.id)
    
    setLessons(data || [])
  }

  return (
    <div className="dashboard">
      {/* Dashboard content */}
    </div>
  )
}
```
