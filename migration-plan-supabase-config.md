# Supabase Integration for Next.js Migration

## Current Supabase Setup (Keep Unchanged)
- Database Schema: ✅ Keep all tables (users, tutors, students, lessons, messages, etc.)
- Authentication: ✅ Keep Google OAuth configuration
- Real-time: ✅ Keep all subscriptions and triggers
- Storage: ✅ Keep file upload configurations

## Next.js Supabase Configuration

### 1. Install Dependencies
```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs
npm install @supabase/auth-helpers-react @supabase/auth-ui-react
```

### 2. Environment Variables (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=https://qbyyutebrgpxngvwenkd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3. Supabase Client Setup
```typescript
// lib/supabase.ts
import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Client-side
export const createClient = () => createClientComponentClient()

// Server-side
export const createServerClient = () => createServerComponentClient({ cookies })
```

### 4. Authentication Migration
```typescript
// Current: Manual OAuth redirect
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/home.html`
  }
});

// Next.js: Simplified with auth helpers
import { useSupabaseClient } from '@supabase/auth-helpers-react'

const supabase = useSupabaseClient()
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/auth/callback`
  }
})
```

### 5. Real-time Messaging Migration
```typescript
// Current: Direct subscription
supabase
  .channel('messages')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, 
    (payload) => {
      // Handle new message
    }
  )
  .subscribe()

// Next.js: Same code works! No changes needed
// Just wrap in useEffect for React lifecycle
useEffect(() => {
  const channel = supabase
    .channel('messages')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, 
      handleNewMessage
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [])
```

## Migration Benefits
- ✅ Zero database migration required
- ✅ All existing user accounts preserved
- ✅ Authentication flow remains identical
- ✅ Real-time features work out of the box
- ✅ All existing data and relationships intact
