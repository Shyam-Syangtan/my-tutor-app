/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // Ensure Vercel builds from root directory
  distDir: '.next',

  // Image optimization for Vercel - NO STATIC EXPORT
  images: {
    domains: ['qbyyutebrgpxngvwenkd.supabase.co', 'lh3.googleusercontent.com']
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://qbyyutebrgpxngvwenkd.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFieXl1dGVicmdweG5ndndlbmtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk3MTA1NTMsImV4cCI6MjA2NTI4NjU1M30.eO8Wd0ZOqtXgvQ3BuedmSPmYVpbG3V-AXvgufLns6yY'
  }
}

module.exports = nextConfig
