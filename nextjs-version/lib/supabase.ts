// Supabase Client Configuration for Next.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Single instance of Supabase client to prevent multiple instances
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})

// Authentication helper functions
export const auth = {
  // Sign in with Google
  async signInWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      })
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Google sign-in error:', error)
      return { data: null, error }
    }
  },

  // Sign out
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { error: null }
    } catch (error) {
      console.error('Sign out error:', error)
      return { error }
    }
  },

  // Get current session
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      return { session, error: null }
    } catch (error) {
      console.error('Get session error:', error)
      return { session: null, error }
    }
  }
}

// Database helper functions for SSR/SSG
export const db = {
  // Get all approved tutors for SSG
  async getTutors() {
    try {
      const { data, error } = await supabase
        .from('tutors')
        .select('*')
        .eq('approved', true)
        .order('rating', { ascending: false })
      
      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      console.error('Get tutors error:', error)
      return { data: [], error }
    }
  },

  // Get single tutor for SSG
  async getTutor(id: string) {
    try {
      const { data, error } = await supabase
        .from('tutors')
        .select('*')
        .eq('id', id)
        .eq('approved', true)
        .single()
      
      if (error) throw error
      return { data, error: null }
    } catch (error) {
      console.error('Get tutor error:', error)
      return { data: null, error }
    }
  },

  // Get tutor IDs for static generation
  async getTutorIds() {
    try {
      const { data, error } = await supabase
        .from('tutors')
        .select('id')
        .eq('approved', true)
      
      if (error) throw error
      return { data: data || [], error: null }
    } catch (error) {
      console.error('Get tutor IDs error:', error)
      return { data: [], error }
    }
  }
}
