// ============================================================
// PASSWORD ANALYSER — Entropy + Pattern Detection
// PRD Section 7.3
// ============================================================

export function calculateEntropy(password) {
  if (!password) return 0
  const charsetSize = getCharsetSize(password)
  return password.length * Math.log2(charsetSize)
}

function getCharsetSize(password) {
  let size = 0
  if (/[a-z]/.test(password)) size += 26
  if (/[A-Z]/.test(password)) size += 26
  if (/[0-9]/.test(password)) size += 10
  if (/[^a-zA-Z0-9]/.test(password)) size += 32
  return size || 1
}

export function estimateCrackTime(entropyBits) {
  const GUESSES_PER_SECOND = 1e10
  const combinations = Math.pow(2, entropyBits)
  const seconds = combinations / (2 * GUESSES_PER_SECOND)

  if (seconds < 1)         return 'Instantly'
  if (seconds < 60)        return `${Math.round(seconds)} seconds`
  if (seconds < 3600)      return `${Math.round(seconds / 60)} minutes`
  if (seconds < 86400)     return `${Math.round(seconds / 3600)} hours`
  if (seconds < 2592000)   return `${Math.round(seconds / 86400)} days`
  if (seconds < 31536000)  return `${Math.round(seconds / 2592000)} months`
  if (seconds < 3153600000) return `${Math.round(seconds / 31536000)} years`
  return `${(seconds / 3153600000).toExponential(1)} centuries`
}

const COMMON_PASSWORDS = [
  'password', 'qwerty', '123456', 'admin', 'letmein',
  'welcome', 'monkey', 'dragon', 'master', 'superman'
]
const KEYBOARD_WALKS = [
  'qwerty', 'asdf', 'zxcv', 'qwertyuiop',
  '1234', '12345', '123456', '1234567890'
]
const LEET_MAP = { '4': 'a', '3': 'e', '1': 'i', '0': 'o', '5': 's', '7': 't', '@': 'a', '$': 's' }

function deLeet(str) {
  return str.toLowerCase().replace(/[43105@$7]/g, c => LEET_MAP[c] || c)
}

export function detectPatterns(password) {
  const patterns = []
  const lower = password.toLowerCase()
  const deleeted = deLeet(lower)

  if (COMMON_PASSWORDS.some(p => lower.includes(p) || deleeted.includes(p)))
    patterns.push('common_password')
  if (KEYBOARD_WALKS.some(k => lower.includes(k)))
    patterns.push('keyboard_walk')
  if (deleeted !== lower && COMMON_PASSWORDS.some(p => deleeted.includes(p)))
    patterns.push('leet_speak')
  if (/(.)\\1{2,}/.test(password))
    patterns.push('repeating_chars')
  if (/^\d+$/.test(password))
    patterns.push('numbers_only')
  if (/012|123|234|345|456|567|678|789|890/.test(password))
    patterns.push('sequential_numbers')
  if (password.length < 8)
    patterns.push('too_short')

  return patterns
}

export function getStrengthScore(password) {
  const entropy  = calculateEntropy(password)
  const patterns = detectPatterns(password)
  const crackTime = estimateCrackTime(entropy)

  let score = Math.min(100, Math.round((entropy / 80) * 100))
  score -= patterns.length * 15
  score = Math.max(0, score)

  const label =
    score <= 20 ? 'VERY_WEAK'  :
    score <= 40 ? 'WEAK'       :
    score <= 60 ? 'FAIR'       :
    score <= 80 ? 'STRONG'     : 'VERY_STRONG'

  return { score, label, entropy: Math.round(entropy), crackTime, patterns }
}
