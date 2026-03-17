import { apiService } from './apiClient'
import { db } from '../db'
import { deviceUtils } from './deviceUtils'

class AuthService {
  constructor() {
    this.tokenRefreshTimer = null
  }

  async init() {
    try {
      const stored = await db.settings.get('auth')
      if (stored?.token) {
        const currentUser = await this.getCurrentUser()
        if (currentUser) {
          return currentUser
        } else {
          await this.logout()
          return null
        }
      }
      return null
    } catch (error) {
      console.warn('Auth initialization failed:', error)
      return null
    }
  }

  async signUp(email, password) {
    try {
      const response = await apiService.post('/v1/auth/register', {
        email,
        password
      })

      if (response.token) {
        const deviceInfo = deviceUtils.getDeviceInfo()
        await this.saveSession(response.token, email, deviceInfo)
      }

      return response
    } catch (error) {
      console.error('Sign up failed:', error)
      throw error
    }
  }

  async signIn(email, password) {
    try {
      const response = await apiService.post('/v1/auth/login', {
        email,
        password
      })

      if (response.token) {
        const deviceInfo = deviceUtils.getDeviceInfo()
        await this.saveSession(response.token, email, deviceInfo)
      }

      return response
    } catch (error) {
      console.error('Sign in failed:', error)
      throw error
    }
  }

  async registerDevice(approvalCode = null) {
    try {
      const deviceInfo = deviceUtils.getDeviceInfo()
      
      const response = await apiService.post('/v1/auth/device/register', {
        deviceName: deviceInfo.name,
        deviceFingerprint: deviceInfo.deviceFingerprint,
        deviceId: deviceInfo.deviceId,
        platform: deviceInfo.platform,
        browser: deviceInfo.browser,
        approvalCode
      })

      if (response.token && response.approved) {
        await this.saveSession(response.token, null, deviceInfo)
      }

      return response
    } catch (error) {
      console.error('Device registration failed:', error)
      throw error
    }
  }

  async loginWithDevice(approvalCode = null) {
    try {
      const deviceInfo = deviceUtils.getDeviceInfo()
      
      const response = await apiService.post('/v1/auth/device/login', {
        deviceFingerprint: deviceInfo.deviceFingerprint,
        approvalCode
      })

      if (response.token && response.approved) {
        await this.saveSession(response.token, response.email, deviceInfo)
      }

      return response
    } catch (error) {
      console.error('Device login failed:', error)
      throw error
    }
  }

  async approveDevice(approvalCode) {
    try {
      const response = await apiService.post('/v1/auth/device/approve', {
        approvalCode
      })
      return response
    } catch (error) {
      console.error('Device approval failed:', error)
      throw error
    }
  }

  async getDevices() {
    try {
      const response = await apiService.get('/v1/auth/devices')
      return response
    } catch (error) {
      console.error('Failed to get devices:', error)
      throw error
    }
  }

  async revokeDevice(deviceId) {
    try {
      await apiService.delete(`/v1/auth/devices/${deviceId}`)
    } catch (error) {
      console.error('Failed to revoke device:', error)
      throw error
    }
  }

  async generateApprovalCode(deviceId) {
    try {
      const response = await apiService.post(`/v1/auth/devices/${deviceId}/code`)
      return response.code
    } catch (error) {
      console.error('Failed to generate approval code:', error)
      throw error
    }
  }

  async logout() {
    try {
      const auth = await db.settings.get('auth')
      if (auth?.token) {
        await apiService.post('/v1/auth/logout', {}, {
          headers: { Authorization: `Bearer ${auth.token}` }
        })
      }
      await db.settings.delete('auth')
      await db.devices.clear()
      await db.syncQueue.clear()
      if (this.tokenRefreshTimer) {
        clearTimeout(this.tokenRefreshTimer)
        this.tokenRefreshTimer = null
      }
    } catch (_error) {
      console.error('Logout failed:', _error)
    }
  }

  async trustCurrentDevice() {
    try {
      const auth = await db.settings.get('auth')
      const deviceInfo = deviceUtils.getDeviceInfo()
      const response = await apiService.post('/v1/auth/device/trust', {
        deviceFingerprint: deviceInfo.deviceFingerprint,
        deviceId: deviceInfo.deviceId,
        deviceName: deviceInfo.name,
        platform: deviceInfo.platform,
        browser: deviceInfo.browser
      }, {
        headers: { Authorization: `Bearer ${auth.token}` }
      })
      return response
    } catch (error) {
      console.error('Failed to trust device:', error)
      throw error
    }
  }

  async getCurrentUser() {
    try {
      const response = await apiService.get('/v1/auth/me')
      return response
    } catch (error) {
      console.error('Failed to get current user:', error)
      return null
    }
  }

  async isAuthenticated() {
    try {
      const auth = await db.settings.get('auth')
      return !!auth?.token
    } catch (error) {
      return false
    }
  }

  async getToken() {
    try {
      const auth = await db.settings.get('auth')
      return auth?.token || null
    } catch (error) {
      return null
    }
  }

  async saveSession(token, email, deviceInfo) {
    try {
      await db.settings.put({
        key: 'auth',
        token,
        email,
        deviceId: deviceInfo.deviceId,
        deviceFingerprint: deviceInfo.deviceFingerprint,
        loginTime: new Date().toISOString()
      })

      await db.devices.put({
        deviceId: deviceInfo.deviceId,
        name: deviceInfo.name,
        platform: deviceInfo.platform,
        browser: deviceInfo.browser,
        approved: true,
        lastAccessedAt: new Date().toISOString()
      })
    } catch (error) {
      console.error('Failed to save session:', error)
    }
  }

  async resetPassword(email) {
    try {
      await apiService.post('/v1/auth/reset-password', { email })
    } catch (_error) {
      console.error('Password reset failed:', _error)
      throw _error
    }
  }

  cleanup() {
    if (this.tokenRefreshTimer) {
      clearTimeout(this.tokenRefreshTimer)
      this.tokenRefreshTimer = null
    }
  }
}

export const authService = new AuthService()
export default authService
