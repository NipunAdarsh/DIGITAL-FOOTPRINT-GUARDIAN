// ============================================================
// RISK SCORER — Custom weighted scoring algorithm
// PRD Section 7.2
// ============================================================

const DATA_CLASS_WEIGHTS = {
  'Passwords': 35,
  'Credit cards': 45,
  'Bank account numbers': 45,
  'Social security numbers': 50,
  'Phone numbers': 20,
  'Physical addresses': 20,
  'Email addresses': 10,
  'Usernames': 10,
  'IP addresses': 15,
  'Dates of birth': 25,
  'Government issued IDs': 40,
  'Health records': 35,
  'Sexual orientations': 30,
  'default': 8,
}

function recencyMultiplier(breachDateStr) {
  const breachYear = new Date(breachDateStr).getFullYear()
  const age = new Date().getFullYear() - breachYear
  if (age <= 1)  return 1.5
  if (age <= 3)  return 1.25
  if (age <= 6)  return 1.0
  if (age <= 10) return 0.75
  return 0.5
}

function compoundingFactor(breachCount) {
  if (breachCount === 0)  return 0
  if (breachCount === 1)  return 1.0
  if (breachCount <= 3)   return 1.2
  if (breachCount <= 6)   return 1.4
  if (breachCount <= 10)  return 1.6
  return 1.8
}

function sensitiveMultiplier(breach) {
  return breach.IsSensitive ? 1.3 : 1.0
}

export function calculateRiskScore(breaches) {
  if (!breaches || breaches.length === 0) {
    return {
      overallScore: 5,
      riskLevel: 'LOW',
      categoryScores: { identityRisk: 5, financialRisk: 5, accountSecurity: 5 },
      breakdown: []
    }
  }

  let rawScore = 0
  const breakdown = []

  for (const breach of breaches) {
    let breachScore = 0
    const dataClasses = breach.DataClasses || []
    for (const dc of dataClasses) {
      breachScore += DATA_CLASS_WEIGHTS[dc] || DATA_CLASS_WEIGHTS['default']
    }
    const recency = recencyMultiplier(breach.BreachDate)
    breachScore *= recency
    breachScore *= sensitiveMultiplier(breach)

    breakdown.push({
      site: breach.Title,
      rawScore: Math.round(breachScore),
      recencyMultiplier: recency,
      isSensitive: breach.IsSensitive
    })
    rawScore += breachScore
  }

  rawScore *= compoundingFactor(breaches.length)
  const normalized = Math.min(100, Math.round((rawScore / 500) * 100))

  const hasFinancial = breaches.some(b =>
    (b.DataClasses || []).some(dc => ['Credit cards', 'Bank account numbers'].includes(dc))
  )
  const hasIdentity = breaches.some(b =>
    (b.DataClasses || []).some(dc =>
      ['Dates of birth', 'Physical addresses', 'Government issued IDs', 'Social security numbers'].includes(dc)
    )
  )
  const hasPasswords = breaches.some(b => (b.DataClasses || []).includes('Passwords'))

  return {
    overallScore: normalized,
    riskLevel: normalized <= 30 ? 'LOW' : normalized <= 60 ? 'MEDIUM' : normalized <= 80 ? 'HIGH' : 'CRITICAL',
    categoryScores: {
      identityRisk:   hasIdentity  ? Math.min(100, normalized + 15) : Math.round(normalized * 0.6),
      financialRisk:  hasFinancial ? Math.min(100, normalized + 20) : Math.round(normalized * 0.4),
      accountSecurity: hasPasswords ? Math.min(100, normalized + 10) : Math.round(normalized * 0.7),
    },
    breakdown
  }
}
