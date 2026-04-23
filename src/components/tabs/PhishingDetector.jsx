import React, { useState, useCallback } from 'react'
import { analyzeUrl as detectPhishing } from '../../utils/phishingDetector'
import { analyzeUrl as aiAnalyzeUrl } from '../../utils/geminiApi'
import { sha256, maskUrl } from '../../utils/hashUtils'
import { saveUrlCheck } from '../../db/queries'

const VERDICT_COLOR = {
  LIKELY_SAFE: { border: 'border-white', text: 'text-white',      bg: 'bg-white/5' },
  SUSPICIOUS:  { border: 'border-yellow-400', text: 'text-yellow-400', bg: 'bg-yellow-400/5' },
  DANGEROUS:   { border: 'border-red-500', text: 'text-red-400',   bg: 'bg-red-500/5' },
}

const SEVERITY_COLOR = {
  HIGH:   'text-red-400',
  MEDIUM: 'text-yellow-400',
  LOW:    'text-white',
}

export default function PhishingDetector({ setCurrentTab }) {
  const [url, setUrl]           = useState('')
  const [phase, setPhase]       = useState('idle')
  const [result, setResult]     = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  const handleCheck = useCallback(async (e) => {
    e?.preventDefault()
    if (!url.trim()) return
    setPhase('analyzing')
    setResult(null)
    setErrorMsg('')

    try {
      const urlHash    = await sha256(url)
      const urlDomain  = maskUrl(url)
      const heuristics = detectPhishing(url)
      const aiVerdict  = await aiAnalyzeUrl(heuristics)

      await saveUrlCheck({
        urlHash, urlDomain,
        verdict:     heuristics.verdict,
        riskSignals: heuristics.signals.map(s => s.signal),
        signalCount: heuristics.signalCount,
        aiVerdict:   aiVerdict.explanation,
      })

      setResult({ heuristics, aiVerdict })
      setPhase('results')
    } catch (err) {
      console.error('[PhishingDetector]', err)
      setErrorMsg(err.message || 'Detection failed.')
      setPhase('error')
    }
  }, [url])

  const verdict = result?.heuristics?.verdict
  const vc = verdict ? VERDICT_COLOR[verdict] : null

  return (
    <main className="flex-1 overflow-auto bg-black">
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '80px 80px' }} />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="mb-16 border-b border-[#222222] pb-8 flex flex-col md:flex-row items-end justify-between">
          <div>
            <p className="font-mono text-[10px] text-[#919191] mb-3 uppercase tracking-[0.3em]">Module_03 / PHISHING_DETECTOR</p>
            <h1 className="font-['Space_Grotesk'] text-6xl font-bold tracking-tighter uppercase leading-none mb-3">
              Phishing<br/>Detector
            </h1>
            <p className="font-mono text-xs text-[#919191] max-w-xs">
              HEURISTIC URL THREAT DETECTION · TYPOSQUATTING · LEVENSHTEIN ANALYSIS
            </p>
          </div>
          <div className="mt-6 md:mt-0 text-right font-mono text-[10px]">
            <div className="text-[#919191] uppercase">ALGORITHM: <span className="text-white">LEVENSHTEIN_DIST</span></div>
            <div className="text-[#919191] uppercase mt-1">LEGIT_DB: <span className="text-white">16 DOMAINS</span></div>
          </div>
        </div>

        {/* Input */}
        <section className="mb-16">
          <form onSubmit={handleCheck}>
            <label className="block font-mono text-[10px] text-[#919191] mb-2 uppercase tracking-[0.3em]">Query_URL_String</label>
            <div className="flex items-stretch border-4 border-white">
              <input
                value={url}
                onChange={e => setUrl(e.target.value)}
                type="text"
                className="flex-1 bg-black text-white p-5 font-mono text-xl focus:outline-none placeholder:text-[#333333]"
                placeholder="https://suspicious-domain.com/login"
                disabled={phase === 'analyzing'}
              />
              <button
                type="submit"
                disabled={!url.trim() || phase === 'analyzing'}
                className="bg-white text-black px-10 font-['Space_Grotesk'] font-bold uppercase tracking-widest text-sm hover:bg-[#d4d4d4] transition-colors disabled:opacity-50"
              >
                {phase === 'analyzing' ? 'SCANNING...' : 'DETECT'}
              </button>
            </div>
            <div className="mt-2 font-mono text-[9px] text-[#919191] text-right">
              SHA-256 HASH STORED / RAW URL NEVER LOGGED
            </div>
          </form>
        </section>

        {/* Loading */}
        {phase === 'analyzing' && (
          <div className="mb-12 border border-[#222222] p-6">
            <div className="flex items-center gap-4">
              <div className="w-2 h-2 bg-white rounded-full animate-ping" />
              <span className="font-mono text-sm text-white tracking-widest">RUNNING_HEURISTIC_ANALYSIS...</span>
            </div>
          </div>
        )}

        {/* Error */}
        {phase === 'error' && (
          <div className="mb-12 border border-red-500/40 p-6">
            <p className="font-mono text-xs text-red-400 uppercase">⚠ ERROR: {errorMsg}</p>
          </div>
        )}

        {/* Results */}
        {phase === 'results' && result && vc && (
          <>
            {/* Verdict Banner */}
            <div className={`mb-12 border-4 ${vc.border} ${vc.bg} p-8 flex flex-col md:flex-row items-center gap-6`}>
              <div className="text-center md:text-left">
                <div className="font-mono text-[10px] text-[#919191] uppercase tracking-widest mb-2">THREAT_VERDICT</div>
                <div className={`font-['Space_Grotesk'] text-5xl font-bold leading-none ${vc.text}`}>
                  {verdict?.replace('_', ' ')}
                </div>
                <div className="font-mono text-xs text-[#919191] mt-2">
                  {result.heuristics.signalCount} SIGNAL{result.heuristics.signalCount !== 1 ? 'S' : ''} DETECTED
                </div>
              </div>
              <div className="flex-1">
                <div className="font-mono text-[10px] text-[#919191] uppercase tracking-widest mb-2">AI_ANALYSIS</div>
                <p className="font-mono text-xs text-white leading-relaxed mb-3">{result.aiVerdict.explanation}</p>
                <div className="border-l-4 border-white pl-4">
                  <div className="font-mono text-[9px] text-[#919191] uppercase mb-1">USER_ADVICE</div>
                  <p className="font-mono text-xs text-white">{result.aiVerdict.userAdvice}</p>
                </div>
              </div>
            </div>

            {/* Signal Table */}
            <section>
              <h2 className="font-['Space_Grotesk'] text-xl font-bold uppercase tracking-widest mb-4">Signal_Analysis</h2>
              {result.heuristics.signals.length === 0 ? (
                <div className="border border-[#222222] p-8 text-center">
                  <div className="font-['Space_Grotesk'] text-2xl font-bold text-white mb-2">✓ NO SIGNALS DETECTED</div>
                  <p className="font-mono text-xs text-[#919191]">URL PASSES ALL HEURISTIC CHECKS</p>
                </div>
              ) : (
                <div className="border border-[#222222]">
                  <div className="grid grid-cols-12 font-mono text-[10px] text-[#919191] uppercase bg-[#080808] border-b border-[#222222]">
                    <div className="col-span-1 p-4 border-r border-[#222222]">#</div>
                    <div className="col-span-3 p-4 border-r border-[#222222]">Severity</div>
                    <div className="col-span-3 p-4 border-r border-[#222222]">Signal_ID</div>
                    <div className="col-span-5 p-4">Detail</div>
                  </div>
                  {result.heuristics.signals.map((sig, i) => (
                    <div key={i} className="grid grid-cols-12 font-mono text-xs border-b border-[#222222] last:border-0 hover:bg-[#0a0a0a]">
                      <div className="col-span-1 p-5 border-r border-[#222222] text-[#919191]">{String(i+1).padStart(2,'0')}</div>
                      <div className={`col-span-3 p-5 border-r border-[#222222] font-bold ${SEVERITY_COLOR[sig.severity]}`}>{sig.severity}</div>
                      <div className="col-span-3 p-5 border-r border-[#222222] text-white uppercase">{sig.signal}</div>
                      <div className="col-span-5 p-5 text-[#919191]">{sig.detail}</div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  )
}