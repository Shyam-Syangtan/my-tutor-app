import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function createServerClient() {
  const cookieStore = await cookies()

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storage: {
          getItem: (key: string) => {
            return cookieStore.get(key)?.value || null
          },
          setItem: (key: string, value: string) => {
            cookieStore.set(key, value)
          },
          removeItem: (key: string) => {
            cookieStore.delete(key)
          },
        },
      },
    }
  )
}

// Server-side database helper functions
export const serverDb = {
  // Get tutors (server-side)
  async getTutors() {
    const supabase = await createServerClient()
    try {
      const { data, error } = await supabase
        .from('tutors')
        .select('*')
        .order('rating', { ascending: false })

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Server get tutors error:', error)
      return { data: null, error }
    }
  },

  // Get user session (server-side)
  async getSession() {
    const supabase = await createServerClient()
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      return { session, error: null }
    } catch (error) {
      console.error('Server get session error:', error)
      return { session: null, error }
    }
  }
}
