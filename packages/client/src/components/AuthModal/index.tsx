import React, { useState } from 'react'
import { Modal } from 'antd'
import { Login } from '../Login'
import { Register } from '../Register'
import './index.scss'

interface AuthModalProps {
  visible: boolean
  onClose: () => void
  defaultMode?: 'login' | 'register'
}

export const AuthModal: React.FC<AuthModalProps> = ({ 
  visible, 
  onClose, 
  defaultMode = 'login' 
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode)

  const handleClose = () => {
    onClose()
    // 延迟重置模式，避免在关闭动画中看到模式切换
    setTimeout(() => {
      setMode(defaultMode)
    }, 300)
  }

  const switchToLogin = () => setMode('login')
  const switchToRegister = () => setMode('register')

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={480}
      centered
      destroyOnClose
      className="auth-modal"
    >
      {mode === 'login' ? (
        <Login 
          onSwitchToRegister={switchToRegister}
          onClose={handleClose}
        />
      ) : (
        <Register 
          onSwitchToLogin={switchToLogin}
          onClose={handleClose}
        />
      )}
    </Modal>
  )
} 