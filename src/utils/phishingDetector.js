// ============================================================
// PHISHING DETECTOR — URL Heuristic + Typosquatting Engine
// PRD Section 7.4
// ============================================================

const LEGIT_DOMAINS = [
  'google.com', 'facebook.com', 'amazon.com', 'microsoft.com', 'apple.com',
  'paypal.com', 'netflix.com', 'linkedin.com', 'twitter.com', 'instagram.com',
  'github.com', 'youtube.com', 'flipkart.com', 'amazon.in',
  'sbi.co.in', 'hdfcbank.com'
]

function levenshtein(a, b) {
  const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i])
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1]
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1]     + 1,
          matrix[i - 1][j]     + 1
        )
      }
    }
  }
  return matrix[b.length][a.length]
}

function isTyposquatting(domain) {
  const domainBase = domain.replace(/\.(com|net|org|io|in|co\.in)$/, '')
  for (const legit of LEGIT_DOMAINS) {
    const legitBase = legit.replace(/\.(com|net|org|io|in|co\.in)$/, '')
    const distance = levenshtein(domainBase, legitBase)
    if (distance > 0 && distance <= 2) return { detected: true, spoofing: legit }
  }
  return { detected: false }
}

export function analyzeUrl(rawUrl) {
  const signals = []
  let domain = ''

  try {
    const url = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`)
    domain = url.hostname

    if (/^\d{1,3}(\.\d{1,3}){3}$/.test(domain))
      signals.push({ signal: 'ip_based_url', severity: 'HIGH', detail: 'URL uses an IP address instead of a hostname' })

    if ((domain.split('.').length - 2) > 2)
      signals.push({ signal: 'excessive_subdomains', severity: 'MEDIUM', detail: 'Too many subdomains detected' })

    if (rawUrl.length > 100)
      signals.push({ signal: 'long_url', severity: 'LOW', detail: 'URL is exceptionally long' })

    if (url.protocol !== 'https:')
      signals.push({ signal: 'no_https', severity: 'MEDIUM', detail: 'No HTTPS encryption — data may be intercepted' })

    if (/@/.test(domain))
      signals.push({ signal: 'at_symbol_in_url', severity: 'HIGH', detail: 'Contains @ symbol — classic phishing trick' })

    const suspiciousWords = ['login', 'verify', 'secure', 'account', 'update', 'confirm', 'banking', 'signin', 'password', 'credential']
    const foundWords = suspiciousWords.filter(w => rawUrl.toLowerCase().includes(w))
    if (foundWords.length >= 2)
      signals.push({ signal: 'suspicious_keywords', severity: 'MEDIUM', detail: `Keywords found: ${foundWords.join(', ')}` })

    const typo = isTyposquatting(domain)
    if (typo.detected)
      signals.push({ signal: 'typosquatting', severity: 'HIGH', detail: `Looks like spoofed version of ${typo.spoofing}` })

  } catch {
    signals.push({ signal: 'invalid_url', severity: 'HIGH', detail: 'Malformed or unparseable URL' })
  }

  const highCount = signals.filter(s => s.severity === 'HIGH').length
  const medCount  = signals.filter(s => s.severity === 'MEDIUM').length
  const verdict   =
    highCount >= 2                    ? 'DANGEROUS'    :
    highCount >= 1 || medCount >= 2   ? 'SUSPICIOUS'   : 'LIKELY_SAFE'

  return { verdict, signals, domain, signalCount: signals.length }
}
