import React, { useState } from 'react'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  showSuccessMessage: (message: string) => void
  showErrorMessage: (message: string) => void
}

export default function LoginModal({
  isOpen,
  onClose,
  showSuccessMessage,
  showErrorMessage
}: LoginModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  console.log('🔥 LoginModal render - isOpen:', isOpen)

  // SIMPLE TEST - Always render something when isOpen is true
  if (!isOpen) {
    console.log('🔥 LoginModal not open, returning null')
    return null
  }

  console.log('🔥 LoginModal is open, rendering modal')
  console.log('🔥 About to render modal JSX')

  // SIMPLE TEST MODAL - Just a big red box
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(255, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      fontSize: '24px',
      color: 'white',
      fontWeight: 'bold'
    }} onClick={onClose}>
      <div>
        MODAL IS WORKING! Click anywhere to close.
      </div>
    </div>
  )
}

