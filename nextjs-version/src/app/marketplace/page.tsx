import { serverDb } from '@/lib/supabase-server'
import TutorMarketplace from '@/components/TutorMarketplace'

export default async function MarketplacePage() {
  // Server-side data fetching for SEO
  const { data: tutors, error } = await serverDb.getTutors()

  if (error) {
    console.error('Error fetching tutors:', error)
  }

  return <TutorMarketplace initialTutors={tutors || []} />
}
