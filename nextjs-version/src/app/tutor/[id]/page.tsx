import { notFound } from 'next/navigation'
import TutorProfile from '@/components/TutorProfile'

// This would typically fetch from your database
async function getTutor(id: string) {
  // Mock data for now - replace with actual database call
  const mockTutor = {
    id,
    name: 'Sample Tutor',
    language: 'English',
    rate: 25,
    rating: 4.8,
    photo_url: '',
    bio: 'Experienced English tutor with 5+ years of teaching experience.',
    specialties: ['Conversation', 'Grammar', 'Business English'],
    video_url: '',
    experience: '5+ years',
    education: 'Bachelor in English Literature',
    certifications: ['TEFL Certified', 'IELTS Preparation'],
    availability: ['Monday 9-17', 'Tuesday 9-17', 'Wednesday 9-17']
  }

  return mockTutor
}

export default async function TutorProfilePage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const tutor = await getTutor(id)

  if (!tutor) {
    notFound()
  }

  return <TutorProfile tutor={tutor} />
}
