import React, { useState, useCallback } from 'react'
import { getBreaches } from '../../utils/leakLookupApi'
import { calculateRiskScore } from '../../utils/riskScorer'
import { analyzeBreaches } from '../../utils/geminiApi'
import { sha256, maskEmail } from '../../utils/hashUtils'
import { saveScan, saveBreaches, saveRemediationSteps } from '../../db/queries'

const RISK_COLOR = {
  LOW:      'text-white',
  MEDIUM:   'text-yellow-400',
  HIGH:     'text-orange-400',
  CRITICAL: 'text-red-400',
}

export default function BreachScanner({ setCurrentTab }) {
  const [email, setEmail]         = useState('')
  const [phase, setPhase]         = useState('idle')   // idle | scanning | scoring | analyzing | results | error
  const [results, setResults]     = useState(null)
  const [errorMsg, setErrorMsg]   = useState('')

  const handleScan = useCallback(async (e) => {
    e?.preventDefault()
    if (!email.trim()) return
    setPhase('scanning')
    setResults(null)
    setErrorMsg('')

    try {
      const emailHash   = await sha256(email.toLowerCase().trim())
      const emailMasked = maskEmail(email)

      // Step 1 — Fetch real breach data
      const breaches   = await getBreaches(email)
      setPhase('scoring')

      // Step 2 — Calculate risk score locally
      const localScore = calculateRiskScore(breaches)
      setPhase('analyzing')

      // Step 3 — AI analysis (isolated — scan succeeds even if Gemini fails)
      let aiAnalysis = null
      try {
        aiAnalysis = await analyzeBreaches(email, breaches, localScore.overallScore)
      } catch (aiErr) {
        console.warn('[Gemini] AI analysis unavailable:', aiErr.message)
      }

      // Step 4 — Persist to Supabase
      const scan = await saveScan({
        emailHash, emailMasked,
        breachCount: breaches.length,
        riskScore:   localScore.overallScore,
        riskLevel:   localScore.riskLevel,
        aiSummary:   aiAnalysis?.summary ?? null,
      })
      await saveBreaches(scan.id, breaches)
      if (aiAnalysis?.remediationSteps) {
        await saveRemediationSteps(scan.id, aiAnalysis.remediationSteps)
      }

      setResults({ breaches, localScore, aiAnalysis })
      setPhase('results')
    } catch (err) {
      console.error('[BreachScanner]', err)
      setErrorMsg(err.message || 'Scan failed. Check console for details.')
      setPhase('error')
    }
  }, [email])

  const phaseLabels = {
    scanning:  'QUERYING_BREACH_DATABASE...',
    scoring:   'CALCULATING_RISK_SCORE...',
    analyzing: 'AI_ANALYSIS_RUNNING...',
  }

  const riskBg = results ? {
    LOW:      'border-white/20',
    MEDIUM:   'border-yellow-400/40',
    HIGH:     'border-orange-400/40',
    CRITICAL: 'border-red-500/60',
  }[results.localScore.riskLevel] : ''

  return (
    <main className="flex-1 overflow-auto bg-black">
      {/* Grid background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '80px 80px' }} />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="mb-16 border-b border-[#222222] pb-8 flex flex-col md:flex-row items-end justify-between">
          <div>
            <p className="font-mono text-[10px] text-[#919191] mb-3 uppercase tracking-[0.3em]">Module_01 / BREACH_SCANNER</p>
            <h1 className="font-['Space_Grotesk'] text-6xl font-bold tracking-tighter uppercase leading-none mb-3">
              Breach<br/>Scanner
            </h1>
            <p className="font-mono text-xs text-[#919191] max-w-xs">
              CRYPTOGRAPHIC AUDIT OF GLOBAL DATA EXFILTRATION EVENTS ACROSS KNOWN REPOSITORIES.
            </p>
          </div>
          <div className="mt-6 md:mt-0 text-right font-mono text-[10px]">
            <div className="text-[#919191] uppercase">SCAN_STATUS: <span className="text-white">{phase === 'idle' ? 'READY' : phase.toUpperCase()}</span></div>
            <div className="text-[#919191] uppercase mt-1">ENGINE: <span className="text-white">BREACH_DB_v2</span></div>
          </div>
        </div>

        {/* Search */}
        <section className="mb-16">
          <form onSubmit={handleScan}>
            <label className="block font-mono text-[10px] text-[#919191] mb-2 uppercase tracking-[0.3em]">Query_Email_Address</label>
            <div className="flex items-stretch border-4 border-white">
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="flex-1 bg-black text-white p-5 font-mono text-xl focus:outline-none placeholder:text-[#333333]"
                placeholder="OPERATOR@TARGET.SYS"
                type="email"
                disabled={['scanning','scoring','analyzing'].includes(phase)}
              />
              <button
                type="submit"
                disabled={['scanning','scoring','analyzing'].includes(phase)}
                className="bg-white text-black px-10 font-['Space_Grotesk'] font-bold uppercase tracking-widest text-sm hover:bg-[#d4d4d4] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {['scanning','scoring','analyzing'].includes(phase) ? 'RUNNING...' : 'SCAN'}
              </button>
            </div>
            <div className="mt-2 font-mono text-[9px] text-[#919191] text-right">
              ENCRYPTION: SHA-256 / NO RAW EMAIL STORED
            </div>
          </form>
        </section>

        {/* Phase indicator */}
        {['scanning','scoring','analyzing'].includes(phase) && (
          <div className="mb-12 border border-[#222222] p-6">
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 bg-white rounded-full animate-ping" />
              <span className="font-mono text-sm text-white tracking-widest">{phaseLabels[phase]}</span>
            </div>
            <div className="mt-4 h-0.5 bg-[#222222] overflow-hidden">
              <div className="h-full bg-white animate-pulse" style={{ width: phase === 'scanning' ? '33%' : phase === 'scoring' ? '66%' : '90%', transition: 'width 0.5s' }} />
            </div>
          </div>
        )}

        {/* Error */}
        {phase === 'error' && (
          <div className="mb-12 border border-red-500/40 p-6">
            <p className="font-mono text-xs text-red-400 uppercase">⚠ SCAN_ERROR: {errorMsg}</p>
          </div>
        )}

        {/* Results */}
        {phase === 'results' && results && (
          <>
            {/* Risk Score Banner */}
            <div className={`mb-12 border-4 ${riskBg} border-white p-8 flex flex-col md:flex-row items-center md:items-start gap-8`}>
              <div className="text-center md:text-left">
                <div className="font-mono text-[10px] text-[#919191] uppercase tracking-widest mb-2">OVERALL_RISK_SCORE</div>
                <div className={`font-['Space_Grotesk'] text-8xl font-bold leading-none ${RISK_COLOR[results.localScore.riskLevel]}`}>
                  {results.localScore.overallScore}
                </div>
                <div className="font-mono text-xs text-[#919191] mt-1">/ 100</div>
              </div>
              <div className="flex-1">
                <div className={`inline-block font-mono text-[10px] tracking-[0.3em] px-3 py-1 border mb-4 ${
                  results.localScore.riskLevel === 'CRITICAL' ? 'border-red-500 text-red-400' :
                  results.localScore.riskLevel === 'HIGH'     ? 'border-orange-400 text-orange-400' :
                  results.localScore.riskLevel === 'MEDIUM'   ? 'border-yellow-400 text-yellow-400' :
                  'border-white text-white'
                }`}>
                  RISK_LEVEL: {results.localScore.riskLevel}
                </div>
                <p className="font-mono text-xs text-[#c6c6c6] leading-relaxed">{results.aiAnalysis.summary}</p>
                <div className="mt-4 grid grid-cols-3 gap-4">
                  {Object.entries(results.localScore.categoryScores).map(([key, val]) => (
                    <div key={key} className="border border-[#222222] p-3">
                      <div className="font-mono text-[9px] text-[#919191] uppercase mb-1">{key.replace(/([A-Z])/g, '_$1').toUpperCase()}</div>
                      <div className="font-['Space_Grotesk'] text-2xl font-bold text-white">{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Breach Table */}
            <section className="mb-12">
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="font-['Space_Grotesk'] text-xl font-bold uppercase tracking-widest">Breach_Repository</h2>
                <div className="font-mono text-[10px] text-[#919191]">RECORDS_FOUND: {String(results.breaches.length).padStart(2, '0')}</div>
              </div>
              {results.breaches.length === 0 ? (
                <div className="border border-[#222222] p-12 text-center">
                  <div className="font-['Space_Grotesk'] text-3xl font-bold text-white mb-2">✓ CLEAN</div>
                  <p className="font-mono text-xs text-[#919191]">NO BREACH RECORDS FOUND FOR THIS EMAIL</p>
                </div>
              ) : (
                <div className="border border-[#222222]">
                  {/* Public API note */}
                  <div className="px-6 py-3 border-b border-[#222222] bg-[#080808] flex items-center justify-between">
                    <span className="font-mono text-[9px] text-[#919191] uppercase tracking-widest">
                      Source: Leak-Lookup · {results.breaches.length} breach{results.breaches.length !== 1 ? 'es' : ''} found
                    </span>
                    <span className="font-mono text-[9px] text-[#555] uppercase tracking-widest">
                      {results.breaches[0]?._records?.length > 0 ? 'PRIVATE_API · FULL_DATA' : 'PUBLIC_API · BREACH_NAMES_ONLY'}
                    </span>
                  </div>
                  <div className="grid grid-cols-12 font-mono text-[10px] text-[#919191] uppercase bg-[#080808] border-b border-[#222222]">
                    <div className="col-span-4 p-4 border-r border-[#222222] tracking-widest">Breach_Name</div>
                    <div className="col-span-3 p-4 border-r border-[#222222] tracking-widest">Domain</div>
                    <div className="col-span-5 p-4 tracking-widest">Exposed_Data</div>
                  </div>
                  {results.breaches.map((b, i) => (
                    <div key={i} className="grid grid-cols-12 font-mono text-xs hover:bg-white hover:text-black transition-colors group cursor-crosshair border-b border-[#222222] last:border-0">
                      <div className="col-span-4 p-5 border-r border-[#222222] font-bold group-hover:border-transparent">
                        {b.Title}
                      </div>
                      <div className="col-span-3 p-5 border-r border-[#222222] text-[#919191] group-hover:text-black group-hover:border-transparent">
                        {b.Domain}
                      </div>
                      <div className="col-span-5 p-5 flex flex-wrap gap-1">
                        {(b.DataClasses || []).map((dc, j) => (
                          <span key={j} className="px-2 py-0.5 bg-[#1f1f1f] border border-[#333333] text-[9px] group-hover:bg-black group-hover:border-black">
                            {dc.toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* AI Analysis */}
            <section>
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="font-['Space_Grotesk'] text-xl font-bold uppercase tracking-widest">AI_Analysis</h2>
                <div className="font-mono text-[10px] text-[#919191]">GROQ · LLAMA-3.3-70B // LIVE</div>
              </div>

              {/* AI unavailable notice */}
              {!results.aiAnalysis && (
                <div className="border border-[#333] p-6 mb-6">
                  <p className="font-mono text-xs text-[#919191] uppercase tracking-widest">
                    ⚠ AI_ANALYSIS_UNAVAILABLE — Check VITE_GEMINI_API_KEY in .env.local
                  </p>
                </div>
              )}

              {/* AI summary */}
              {results.aiAnalysis?.summary && (
                <div className="border border-[#222222] p-6 mb-6">
                  <div className="font-mono text-[9px] text-[#919191] uppercase tracking-widest mb-3">AI_SUMMARY</div>
                  <p className="font-mono text-xs text-white leading-relaxed">{results.aiAnalysis.summary}</p>
                </div>
              )}

              {/* Remediation steps */}
              {results.aiAnalysis?.remediationSteps?.length > 0 && (
                <>
                  <div className="font-mono text-[9px] text-[#919191] uppercase tracking-widest mb-3">REMEDIATION_PLAN</div>
                  <div className="space-y-0 border border-[#222222]">
                    {results.aiAnalysis.remediationSteps.map((step, i) => {
                      const priorityColor = step.priority === 'CRITICAL' ? 'text-red-400' : step.priority === 'HIGH' ? 'text-orange-400' : 'text-yellow-400'
                      return (
                        <div key={i} className="grid grid-cols-12 font-mono text-xs border-b border-[#222222] last:border-0 hover:bg-[#0a0a0a]">
                          <div className="col-span-1 p-5 border-r border-[#222222] text-[#919191] text-center">{String(i + 1).padStart(2, '0')}</div>
                          <div className={`col-span-2 p-5 border-r border-[#222222] ${priorityColor} font-bold text-[10px]`}>{step.priority}</div>
                          <div className="col-span-6 p-5 border-r border-[#222222] text-white">{step.action}</div>
                          <div className="col-span-3 p-5 text-[#919191]">{step.timeToFix || step.time_to_fix}</div>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  )
}