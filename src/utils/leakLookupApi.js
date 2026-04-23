// ============================================================
// LEAK-LOOKUP API — Real breach data via Supabase Edge proxy
// Endpoint: leak-lookup.com/api/search
// Proxy: supabase edge fn "leak-lookup-proxy"
// PRD Section 7.7
// ============================================================

const PROXY_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/leak-lookup-proxy`

// ── Response normalizer ────────────────────────────────────────
// Leak-Lookup returns: { error: "false", message: { "BreachName": [...records] } }
// We normalize each breach into the same shape the rest of the app expects,
// matching the field names used by riskScorer.js and BreachScanner.jsx.
function normalizeBreaches(message) {
  if (!message || typeof message !== 'object') return []

  return Object.entries(message).map(([breachName, records]) => {
    // Derive data classes from the column names present in the first record
    const sample   = Array.isArray(records) && records.length > 0 ? records[0] : {}
    const dataClasses = deriveDataClasses(sample)

    // Try to extract a breach date from the records
    const breachDate = extractBreachDate(breachName, records)

    // Estimate pwn count — not provided by public API, use record count or 0
    const pwnCount = Array.isArray(records) ? records.length : 0

    return {
      // Standard shape used throughout the app
      Name:        breachName,
      Title:       breachName,
      Domain:      extractDomain(sample, breachName),
      BreachDate:  breachDate,
      PwnCount:    pwnCount,
      DataClasses: dataClasses,
      IsVerified:  true,
      IsSensitive: isSensitiveBreach(dataClasses),
      // Raw records for detailed view (private API only — empty on public key)
      _records:    Array.isArray(records) ? records : [],
    }
  })
}

function deriveDataClasses(record) {
  const classes = []
  const keys = Object.keys(record).map(k => k.toLowerCase())

  if (keys.some(k => ['email', 'email_address', 'emailaddress'].includes(k)))
    classes.push('Email addresses')
  if (keys.some(k => ['password', 'hash', 'password2', 'password3', 'plaintext'].includes(k)))
    classes.push('Passwords')
  if (keys.some(k => ['username', 'uname', 'user_name', 'membername'].includes(k)))
    classes.push('Usernames')
  if (keys.some(k => ['phone', 'mobile', 'telephone', 'number'].includes(k)))
    classes.push('Phone numbers')
  if (keys.some(k => ['firstname', 'first_name', 'lastname', 'last_name', 'fullname', 'fname', 'lname'].includes(k)))
    classes.push('Names')
  if (keys.some(k => ['address', 'address1', 'city', 'state', 'postcode', 'zipcode'].includes(k)))
    classes.push('Physical addresses')
  if (keys.some(k => ['ipaddress', 'ip_address', 'ip'].includes(k)))
    classes.push('IP addresses')
  if (keys.some(k => ['country'].includes(k)))
    classes.push('Geographic locations')

  // Public API returns empty arrays — still meaningful: breach found
  return classes.length > 0 ? classes : ['Email addresses']
}

function extractDomain(record, breachName) {
  const domainField = record['domain_name'] || record['domain'] || ''
  if (domainField) return domainField
  // Heuristic: lowercase breach name, strip spaces, add .com
  return breachName.toLowerCase().replace(/\s+/g, '') + '.com'
}

function extractBreachDate(breachName, records) {
  // Breach-Lookup doesn't provide dates — we return a placeholder past date
  // so riskScorer recency logic works (older = lower multiplier)
  return '2020-01-01'
}

function isSensitiveBreach(dataClasses) {
  const sensitive = ['Passwords', 'Physical addresses', 'Phone numbers']
  return dataClasses.some(dc => sensitive.includes(dc))
}

// ── Main export ────────────────────────────────────────────────

/**
 * Fetches real breach data for an email via the Leak-Lookup API.
 * Returns an array of normalized breach objects.
 * Throws on network/API errors (caught upstream in components).
 */
export async function getBreaches(email) {
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  const leakLookupKey   = import.meta.env.VITE_LEAK_LOOKUP_API_KEY

  const response = await fetch(PROXY_URL, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
    // apiKey is forwarded to the proxy — the proxy uses it to call Leak-Lookup.
    // The proxy will prefer a server-side secret if set, otherwise uses this value.
    body: JSON.stringify({ email: email.toLowerCase().trim(), apiKey: leakLookupKey }),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`Proxy error ${response.status}: ${text || 'No response body'}`)
  }

  const data = await response.json()

  // Leak-Lookup uses string "false"/"true" for error field
  if (data.error === 'true' || data.error === true) {
    throw new Error(`Leak-Lookup API: ${data.message || 'Unknown error'}`)
  }

  // message === "false" (string) means no results found
  if (data.message === 'false' || data.message === false) return []

  return normalizeBreaches(data.message)
}
