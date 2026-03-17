import { useEffect, useState } from 'react'
import { useAuthStore } from '../../stores/auth'
import { Smartphone, Trash2, Copy, Check, X, RefreshCw, Shield } from 'lucide-react'
import { deviceUtils } from '../../services/deviceUtils'
import './device-manager.css'

export function DeviceManager() {
  const { devices, refreshDevices, revokeDevice, generateApprovalCode, trustCurrentDevice, isLoading } = useAuthStore()
  const [copiedId, setCopiedId] = useState(null)
  const [generatedCode, setGeneratedCode] = useState(null)
  const [deviceForCode, setDeviceForCode] = useState(null)

  useEffect(() => {
    refreshDevices()
  }, [refreshDevices])

  const currentDeviceInfo = deviceUtils.getDeviceInfo()
  const currentDevice = devices.find(d => d.deviceId === currentDeviceInfo.deviceId)

  const handleCopy = async (code, deviceId) => {
    await navigator.clipboard.writeText(code)
    setCopiedId(deviceId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleGenerateCode = async (deviceId) => {
    try {
      const code = await generateApprovalCode(deviceId)
      setGeneratedCode(code)
      setDeviceForCode(deviceId)
    } catch (err) {
      console.error('Failed to generate code:', err)
    }
  }

  const handleRevoke = async (deviceId) => {
    if (window.confirm('Are you sure you want to revoke this device? It will no longer be able to access your account.')) {
      try {
        await revokeDevice(deviceId)
      } catch (err) {
        console.error('Failed to revoke device:', err)
      }
    }
  }

  const handleTrustDevice = async () => {
    try {
      await trustCurrentDevice()
    } catch (err) {
      console.error('Failed to trust device:', err)
    }
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never'
    return new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="device-manager">
      <div className="device-header">
        <h3>Trusted Devices</h3>
        <button 
          className="btn btn-icon" 
          onClick={() => refreshDevices()}
          title="Refresh devices"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {!currentDevice && (
        <div className="device-trust-prompt">
          <p>This device is not registered as trusted.</p>
          <button 
            className="btn btn-primary" 
            onClick={handleTrustDevice}
            disabled={isLoading}
          >
            <Shield size={18} />
            {isLoading ? 'Trusting...' : 'Trust this Device'}
          </button>
        </div>
      )}

      {devices.length === 0 && currentDevice ? (
        <div className="device-empty">
          <Smartphone size={32} />
          <p>No devices registered yet.</p>
          <p className="device-empty-hint">Use "Login with this Device" to register your first device.</p>
        </div>
      ) : (
        <div className="device-list">
          {devices.map((device) => (
            <div key={device.id} className="device-item">
              <div className="device-icon">
                <Smartphone size={20} />
              </div>
              <div className="device-info">
                <div className="device-name">
                  {device.name}
                  {device.approved ? (
                    <span className="device-badge device-badge-approved">Approved</span>
                  ) : (
                    <span className="device-badge device-badge-pending">Pending</span>
                  )}
                </div>
                <div className="device-meta">
                  <span>{device.platform}</span>
                  <span className="device-separator">|</span>
                  <span>{device.browser}</span>
                </div>
                <div className="device-last-access">
                  Last accessed: {formatDate(device.lastAccessedAt)}
                </div>
              </div>
              <div className="device-actions">
                {device.approved && (
                  <button
                    className="btn btn-icon btn-small"
                    onClick={() => handleGenerateCode(device.id)}
                    title="Generate approval code"
                  >
                    <Copy size={16} />
                  </button>
                )}
                <button
                  className="btn btn-icon btn-small btn-danger"
                  onClick={() => handleRevoke(device.id)}
                  title="Revoke device"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {generatedCode && deviceForCode === device.id && (
                <div className="device-code-popup">
                  <div className="device-code-header">
                    <span>Approval Code</span>
                    <button 
                      className="btn btn-icon btn-small"
                      onClick={() => { setGeneratedCode(null); setDeviceForCode(null) }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="device-code-value">
                    <code>{generatedCode}</code>
                    <button
                      className="btn btn-icon btn-small"
                      onClick={() => handleCopy(generatedCode, device.id)}
                    >
                      {copiedId === device.id ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                  <div className="device-code-hint">
                    Share this code with the device you want to approve. It expires in 15 minutes.
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default DeviceManager
