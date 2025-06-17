'use client'

import MessagesPage from '@/components/MessagesPage'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function Messages() {
  return (
    <ProtectedRoute>
      <MessagesPage />
    </ProtectedRoute>
  )
}
