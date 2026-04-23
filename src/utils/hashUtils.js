// SHA-256 hash — privacy-safe email storage
export async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Mask email: john@gmail.com → jo****@gmail.com
export function maskEmail(email) {
  const [local, domain] = email.split('@')
  if (!domain) return email
  const masked = local.slice(0, 2) + '****'
  return `${masked}@${domain}`
}

// Extract hostname from URL
export function maskUrl(url) {
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`).hostname
  } catch {
    return 'invalid-url'
  }
}
