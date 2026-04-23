// ============================================================
// AI ANALYSIS — Powered by Groq (Llama 3.3 70B)
// Endpoint: api.groq.com/openai/v1/chat/completions
// Model: llama-3.3-70b-versatile (fast + free tier)
// PRD Section 7.8
// ============================================================

const MODEL   = 'llama-3.3-70b-versatile'
const API_URL = 'https://api.groq.com/openai/v1/chat/completions'

const SYSTEM_PROMPT = `You are a cybersecurity expert AI assistant. 
You MUST respond with ONLY a valid JSON object — no markdown, no code fences, no backticks, no explanation text outside the JSON.`

// ── Prompts ────────────────────────────────────────────────────

const buildBreachPrompt = (email, breaches, localScore) => `
Analyze this user's data breach exposure. Local risk algorithm scored them ${localScore}/100.

EMAIL (masked): ${email}
BREACH COUNT: ${breaches.length}
RISK SCORE: ${localScore}/100
BREACHES FOUND: ${breaches.map(b => `${b.Title} (${b.Domain}) — exposed: ${(b.DataClasses || []).join(', ')}`).join(' | ')}

Return ONLY this exact JSON structure — be specific to the actual breaches listed above:
{
  "summary": "<2 sentence plain English explanation of THIS user's specific risk based on the exact breaches above>",
  "topThreats": [
    { "breach": "<site name from the list>", "why": "<1 sentence: why this specific breach is dangerous for this user>" }
  ],
  "remediationSteps": [
    { "priority": "CRITICAL", "action": "<specific action tailored to these breaches>", "reason": "<why this matters for these breaches>", "timeToFix": "<realistic time>" },
    { "priority": "HIGH",     "action": "<specific action>", "reason": "<why>", "timeToFix": "<time>" },
    { "priority": "MEDIUM",   "action": "<specific action>", "reason": "<why>", "timeToFix": "<time>" }
  ]
}`

const buildPasswordPrompt = (analysis) => `
A user's password was security-analyzed with these results:
- Strength rating: ${analysis.label} (${analysis.score}/100)
- Shannon entropy: ${analysis.entropy} bits
- Estimated crack time at 10B guesses/sec: ${analysis.crackTime}
- Weakness patterns detected: ${analysis.patterns.length > 0 ? analysis.patterns.join(', ') : 'none detected'}

Return ONLY this JSON — be specific about the actual patterns found:
{
  "feedback": "<2 sentences: explain WHY this password scores ${analysis.score}/100, referencing the specific patterns found>",
  "suggestion": "<1 highly specific, actionable tip to make it stronger — not generic advice>"
}`

const buildUrlPrompt = (urlAnalysis) => `
A URL was scanned for phishing indicators:
- Domain: ${urlAnalysis.domain}
- Final verdict: ${urlAnalysis.verdict}
- Security signals triggered: ${urlAnalysis.signals.length > 0 ? urlAnalysis.signals.map(s => `${s.signal} [${s.severity}]: ${s.detail}`).join(' | ') : 'none'}

Return ONLY this JSON:
{
  "verdict": "${urlAnalysis.verdict}",
  "explanation": "<2 sentences: explain why this URL got this verdict, referencing the specific signals triggered or not triggered>",
  "userAdvice": "<1 precise sentence: tell the user exactly what to do>"
}`

// ── Core Groq fetch ────────────────────────────────────────────

async function callGroq(userPrompt) {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY
  if (!apiKey || apiKey === 'YOUR_GROQ_API_KEY_HERE') {
    throw new Error('Groq API key not configured — add VITE_GROQ_API_KEY to .env.local')
  }

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model:           MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: userPrompt    },
      ],
      temperature: 0.3,   // Lower = more consistent JSON
      max_tokens:  1024,
    }),
  })

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}))
    const detail  = errBody?.error?.message || `HTTP ${response.status}`
    throw new Error(`Groq API error: ${detail}`)
  }

  const data    = await response.json()
  const content = data.choices?.[0]?.message?.content || ''
  if (!content) throw new Error('Groq returned an empty response')

  return JSON.parse(content)
}

// ── Exports — no try/catch here; callers handle failures ───────

/**
 * Analyzes breach data → { summary, topThreats, remediationSteps }
 * Throws on API failure — caller catches and sets aiAnalysis = null.
 */
export async function analyzeBreaches(email, breaches, localScore) {
  return await callGroq(buildBreachPrompt(email, breaches, localScore))
}

/**
 * Analyzes password strength → { feedback, suggestion }
 * Throws on API failure — caller catches and sets aiFeedback = null.
 */
export async function analyzePassword(passwordAnalysis) {
  return await callGroq(buildPasswordPrompt(passwordAnalysis))
}

/**
 * Analyzes phishing heuristics → { verdict, explanation, userAdvice }
 * Throws on API failure — caller catches and sets aiVerdict = null.
 */
export async function analyzeUrl(urlAnalysis) {
  return await callGroq(buildUrlPrompt(urlAnalysis))
}
