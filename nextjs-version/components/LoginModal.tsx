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

  // NUCLEAR OPTION - Multiple rendering attempts
  console.log('🔥 RENDERING MODAL NOW!')

  // Try to force render by modifying the DOM directly
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      const existingModal = document.getElementById('debug-modal')
      if (!existingModal) {
        const modalDiv = document.createElement('div')
        modalDiv.id = 'debug-modal'
        modalDiv.style.cssText = `
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          background-color: red !important;
          z-index: 999999 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-size: 48px !important;
          color: white !important;
          font-weight: bold !important;
          text-align: center !important;
          cursor: pointer !important;
        `
        modalDiv.innerHTML = '🔥 DIRECT DOM MODAL! 🔥<br/>Click to close'
        modalDiv.onclick = () => {
          document.body.removeChild(modalDiv)
          onClose()
        }
        document.body.appendChild(modalDiv)
        console.log('🔥 Direct DOM modal added!')
      }
    }, 100)
  }

  return (
    <>
      {/* React version */}
      <div
        id="react-modal"
        style={{
          position: 'fixed',
          top: '0px',
          left: '0px',
          width: '100vw',
          height: '100vh',
          backgroundColor: 'blue',
          zIndex: 999998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '36px',
          color: 'white',
          fontWeight: 'bold',
          textAlign: 'center',
          cursor: 'pointer'
        }}
        onClick={onClose}
      >
        <div>
          🔥 REACT MODAL WORKING! 🔥<br/>
          State: {isOpen ? 'OPEN' : 'CLOSED'}<br/>
          Click to close
        </div>
      </div>

      {/* Backup version with different positioning */}
      <div style={{
        position: 'fixed',
        top: '100px',
        left: '100px',
        width: '400px',
        height: '300px',
        backgroundColor: 'green',
        color: 'white',
        zIndex: 999997,
        display: 'block',
        fontSize: '20px',
        fontWeight: 'bold',
        padding: '20px',
        border: '5px solid yellow'
      }}>
        BACKUP MODAL - Should be visible!
      </div>
    </>
  )
}

