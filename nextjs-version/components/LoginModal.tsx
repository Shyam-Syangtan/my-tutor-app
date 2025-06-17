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
  console.log('🔥 LoginModal props:', { isOpen, onClose, showSuccessMessage, showErrorMessage })

  // ALWAYS RENDER SOMETHING FOR DEBUGGING - Don't return null
  if (!isOpen) {
    console.log('🔥 LoginModal not open, but still rendering debug div')
    return (
      <div style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        backgroundColor: 'orange',
        color: 'black',
        padding: '10px',
        zIndex: 999999,
        fontSize: '12px'
      }}>
        Modal component loaded but isOpen=false
      </div>
    )
  }

  console.log('🔥 LoginModal is open, rendering modal')
  console.log('🔥 About to render modal JSX')

  // ULTRA AGGRESSIVE TEST MODAL - Should be impossible to miss
  return (
    <>
      <div style={{
        position: 'fixed',
        top: '0px',
        left: '0px',
        width: '100vw',
        height: '100vh',
        backgroundColor: 'red',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '48px',
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
        cursor: 'pointer'
      }} onClick={onClose}>
        <div>
          🔥 MODAL IS WORKING! 🔥<br/>
          Click anywhere to close.<br/>
          State: {isOpen ? 'OPEN' : 'CLOSED'}
        </div>
      </div>

      {/* Also add a portal version in case there's a rendering context issue */}
      <div style={{
        position: 'absolute',
        top: '50px',
        left: '50px',
        width: '300px',
        height: '200px',
        backgroundColor: 'blue',
        color: 'white',
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        fontWeight: 'bold'
      }}>
        BACKUP MODAL VISIBLE
      </div>
    </>
  )
}

