function generateDeviceId() {
  const stored = localStorage.getItem('deviceId')
  if (stored) return stored
  
  const newId = crypto.randomUUID()
  localStorage.setItem('deviceId', newId)
  return newId
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
  
  const fingerprintData = `${deviceId}|${platform}|${browser}|${screenRes}|${language}`
  
  let fingerprint = 0
  for (let i = 0; i < fingerprintData.length; i++) {
    const char = fingerprintData.charCodeAt(i)
    fingerprint = ((fingerprint << 5) - fingerprint) + char
    fingerprint = fingerprint & fingerprint
  }
  
  return {
    deviceId,
    deviceFingerprint: Math.abs(fingerprint).toString(16),
    name: `${browser} on ${platform}`,
    platform,
    browser
  }
}

function generateFingerprint() {
  const info = getDeviceInfo()
  return info.deviceFingerprint
}

export const deviceUtils = {
  generateDeviceId,
  getDeviceInfo,
  generateFingerprint
}

export default deviceUtils
