function generateDeviceId() {
  const stored = localStorage.getItem('deviceId')
  if (stored) return stored
  
  let newId
  if (crypto.randomUUID && window.isSecureContext) {
    newId = crypto.randomUUID()
  } else {
    newId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }
  localStorage.setItem('deviceId', newId)
  return newId
}

function generateFingerprintValue(deviceId, platform, browser, screenRes, language) {
  const fingerprintData = `${deviceId}|${platform}|${browser}|${screenRes}|${language}`
  
  let fingerprint = 0
  for (let i = 0; i < fingerprintData.length; i++) {
    const char = fingerprintData.charCodeAt(i)
    fingerprint = ((fingerprint << 5) - fingerprint) + char
    fingerprint = fingerprint >>> 0
  }
  
  return Math.abs(fingerprint).toString(16)
}

function getDeviceFingerprint() {
  const stored = localStorage.getItem('deviceFingerprint')
  return stored
}

function getDeviceInfo() {
  const ua = navigator.userAgent
  
  let platform = 'Unknown'
  if (ua.includes('Windows')) platform = 'Windows'
  else if (ua.includes('Mac')) platform = 'macOS'
  else if (ua.includes('Linux')) platform = 'Linux'
  else if (ua.includes('Android')) platform = 'Android'
  else if (ua.includes('iPhone') || ua.includes('iPad')) platform = 'iOS'
  
  let browser = 'Unknown'
  if (ua.includes('Chrome')) browser = 'Chrome'
  else if (ua.includes('Firefox')) browser = 'Firefox'
  else if (ua.includes('Safari')) browser = 'Safari'
  else if (ua.includes('Edge')) browser = 'Edge'
  else if (ua.includes('Opera')) browser = 'Opera'
  
  const screenRes = `${window.screen.width}x${window.screen.height}`
  const language = navigator.language || 'en-US'
  
  const deviceId = generateDeviceId()
  
  let deviceFingerprint = getDeviceFingerprint()
  if (!deviceFingerprint) {
    deviceFingerprint = generateFingerprintValue(deviceId, platform, browser, screenRes, language)
    localStorage.setItem('deviceFingerprint', deviceFingerprint)
  }
  
  return {
    deviceId,
    deviceFingerprint,
    name: `${browser} on ${platform}`,
    platform,
    browser
  }
}

function generateFingerprint() {
  const deviceInfo = getDeviceInfo()
  return deviceInfo.deviceFingerprint
}

export const deviceUtils = {
  generateDeviceId,
  getDeviceInfo,
  generateFingerprint,
  getDeviceFingerprint
}

export default deviceUtils
