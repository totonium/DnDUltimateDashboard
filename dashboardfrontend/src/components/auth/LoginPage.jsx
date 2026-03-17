import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useAuthStore } from '../../stores/auth'
import { Shield, Smartphone, LogIn, UserPlus } from 'lucide-react'
import './auth.css'

export function LoginPage() {
  const navigate = useNavigate()
  const { login, register, loginWithDevice, registerDevice, isLoading, error, clearError } = useAuthStore()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegisterMode, setIsRegisterMode] = useState(false)
  const [approvalCode, setApprovalCode] = useState('')
  const [showApprovalInput, setShowApprovalInput] = useState(false)

  const handleDeviceLogin = async () => {
    try {
      const response = await loginWithDevice()
      if (response.approved) {
        navigate({ to: '/' })
      } else {
        setShowApprovalInput(true)
      }
    } catch (err) {
      console.error('Device login failed:', err)
    }
  }

  const handleEmailLogin = async (e) => {
    e.preventDefault()
    try {
      await login(email, password)
      navigate({ to: '/' })
    } catch (err) {
      console.error('Login failed:', err)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    try {
      await register(email, password)
      navigate({ to: '/' })
    } catch (err) {
      console.error('Registration failed:', err)
    }
  }

  const handleApprovalSubmit = async (e) => {
    e.preventDefault()
    try {
      await registerDevice(approvalCode)
      navigate({ to: '/' })
    } catch (err) {
      console.error('Approval failed:', err)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <Shield size={48} className="auth-logo" />
          <h1>DnD Dashboard</h1>
          <p>Your personal command center</p>
        </div>

        {showApprovalInput ? (
          <div className="auth-card">
            <h2>Device Approval Required</h2>
            <p className="auth-subtitle">
              Enter the approval code from an approved device to continue.
            </p>
            <form onSubmit={handleApprovalSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="approvalCode">Approval Code</label>
                <input
                  id="approvalCode"
                  type="text"
                  value={approvalCode}
                  onChange={(e) => setApprovalCode(e.target.value.toUpperCase())}
                  placeholder="XXXXXXXX"
                  maxLength={8}
                  required
                />
              </div>
              {error && <div className="auth-error">{error}</div>}
              <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
                {isLoading ? 'Approving...' : 'Approve Device'}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary btn-block"
                onClick={() => {
                  setShowApprovalInput(false)
                  clearError()
                }}
              >
                Back
              </button>
            </form>
          </div>
        ) : (
          <>
            <div className="auth-card">
              <button 
                onClick={handleDeviceLogin} 
                className="btn btn-primary btn-lg btn-block auth-device-btn"
                disabled={isLoading}
              >
                <Smartphone size={20} />
                {isLoading ? 'Connecting...' : 'Login with this Device'}
              </button>
              
              <div className="auth-divider">
                <span>or use email</span>
              </div>
              <form onSubmit={isRegisterMode ? handleRegister : handleEmailLogin} className="auth-form">
                
                  <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {error && <div className="auth-error">{error}</div>}
                
                <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
                  {isRegisterMode ? (
                    <>
                      <UserPlus size={18} />
                      Create Account
                    </>
                  ) : (
                    <>
                      <LogIn size={18} />
                      Login
                    </>
                  )}
                </button>
              </form>
              
              <div className="auth-toggle">
                {isRegisterMode ? (
                  <p>
                    Already have an account?{' '}
                    <button onClick={() => { setIsRegisterMode(false); clearError() }}>
                      Login
                    </button>
                  </p>
                ) : (
                  <p>
                    Need an account?{' '}
                    <button onClick={() => { setIsRegisterMode(true); clearError() }}>
                      Register
                    </button>
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default LoginPage
