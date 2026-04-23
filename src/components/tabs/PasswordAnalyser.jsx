import React, { useState, useCallback } from 'react'
import { getStrengthScore } from '../../utils/passwordAnalyser'
import { analyzePassword } from '../../utils/geminiApi'
import { savePasswordCheck } from '../../db/queries'

const LABEL_COLOR = {
  VERY_WEAK:   'text-red-400',
  WEAK:        'text-orange-400',
  FAIR:        'text-yellow-400',
  STRONG:      'text-green-400',
  VERY_STRONG: 'text-white',
}

const LABEL_BAR = {
  VERY_WEAK:   { width: '10%', color: 'bg-red-500' },
  WEAK:        { width: '30%', color: 'bg-orange-500' },
  FAIR:        { width: '55%', color: 'bg-yellow-500' },
  STRONG:      { width: '78%', color: 'bg-green-500' },
  VERY_STRONG: { width: '100%', color: 'bg-white' },
}

export default function PasswordAnalyser({ setCurrentTab }) {
  const [password, setPassword]   = useState('')
  const [showPwd, setShowPwd]     = useState(false)
  const [phase, setPhase]         = useState('idle')   // idle | analyzing | results | error
  const [result, setResult]       = useState(null)
  const [errorMsg, setErrorMsg]   = useState('')

  // Live preview as user types
  const liveAnalysis = password ? getStrengthScore(password) : null

  const handleCheck = useCallback(async (e) => {
    e?.preventDefault()
    if (!password) return
    setPhase('analyzing')
    setErrorMsg('')

    try {
      const analysis = getStrengthScore(password)

      // AI feedback — isolated so score always shows even if Gemini is down
      let aiFeedback = null
      try {
        aiFeedback = await analyzePassword(analysis)
      } catch (aiErr) {
        console.warn('[Gemini] Password AI unavailable:', aiErr.message)
      }

      await savePasswordCheck({
        strengthScore: analysis.score,
        strengthLabel: analysis.label,
        entropyBits:   analysis.entropy,
        crackTime:     analysis.crackTime,
        patternsFound: analysis.patterns,
        aiFeedback:    aiFeedback?.feedback ?? null,
      })

      setResult({ analysis, aiFeedback })
      setPhase('results')
    } catch (err) {
      console.error('[PasswordAnalyser]', err)
      setErrorMsg(err.message || 'Analysis failed.')
      setPhase('error')
    }
  }, [password])

  return (
    <main className="flex-1 overflow-auto bg-black">
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '80px 80px' }} />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="mb-16 border-b border-[#222222] pb-8 flex flex-col md:flex-row items-end justify-between">
          <div>
            <p className="font-mono text-[10px] text-[#919191] mb-3 uppercase tracking-[0.3em]">Module_02 / PASSWORD_ANALYSER</p>
            <h1 className="font-['Space_Grotesk'] text-6xl font-bold tracking-tighter uppercase leading-none mb-3">
              Password<br/>Analyser
            </h1>
            <p className="font-mono text-xs text-[#919191] max-w-xs">
              ENTROPY CALCULATION · PATTERN DETECTION · AI-POWERED VULNERABILITY ASSESSMENT
            </p>
          </div>
          <div className="mt-6 md:mt-0 text-right font-mono text-[10px]">
            <div className="text-[#919191] uppercase">ENGINE: <span className="text-white">SHANNON_ENTROPY</span></div>
            <div className="text-[#919191] uppercase mt-1">GUESS_RATE: <span className="text-white">10B/SEC</span></div>
          </div>
        </div>

        {/* Input */}
        <section className="mb-10">
          <form onSubmit={handleCheck}>
            <label className="block font-mono text-[10px] text-[#919191] mb-2 uppercase tracking-[0.3em]">Input_Password_String</label>
            <div className="flex items-stretch border-4 border-white">
              <input
                value={password}
                onChange={e => setPassword(e.target.value)}
                type={showPwd ? 'text' : 'password'}
                className="flex-1 bg-black text-white p-5 font-mono text-xl focus:outline-none placeholder:text-[#333333] tracking-widest"
                placeholder="••••••••••••••••"
                disabled={phase === 'analyzing'}
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                className="px-4 text-[#919191] hover:text-white border-l border-white material-symbols-outlined transition-colors"
              >
                {showPwd ? 'visibility_off' : 'visibility'}
              </button>
              <button
                type="submit"
                disabled={!password || phase === 'analyzing'}
                className="bg-white text-black px-10 font-['Space_Grotesk'] font-bold uppercase tracking-widest text-sm hover:bg-[#d4d4d4] transition-colors disabled:opacity-50 border-l border-white"
              >
                {phase === 'analyzing' ? 'ANALYSING...' : 'ANALYSE'}
              </button>
            </div>
            <div className="mt-2 font-mono text-[9px] text-[#919191] text-right">
              PASSWORD IS NEVER STORED — ONLY ENTROPY METRICS ARE SAVED
            </div>
          </form>
        </section>

        {/* Live meter while typing */}
        {liveAnalysis && phase !== 'results' && (
          <div className="mb-12 border border-[#222222] p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[10px] text-[#919191] uppercase tracking-widest">LIVE_STRENGTH_METER</span>
              <span className={`font-mono text-sm font-bold ${LABEL_COLOR[liveAnalysis.label] || 'text-white'}`}>
                {liveAnalysis.label.replace('_', ' ')}
              </span>
            </div>
            <div className="h-1 bg-[#222222] overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${LABEL_BAR[liveAnalysis.label]?.color || 'bg-white'}`}
                style={{ width: LABEL_BAR[liveAnalysis.label]?.width || '0%' }}
              />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 font-mono text-xs">
              <div>
                <div className="text-[9px] text-[#919191] uppercase mb-1">Entropy</div>
                <div className="text-white font-bold">{liveAnalysis.entropy} bits</div>
              </div>
              <div>
                <div className="text-[9px] text-[#919191] uppercase mb-1">Crack Time</div>
                <div className="text-white font-bold">{liveAnalysis.crackTime}</div>
              </div>
              <div>
                <div className="text-[9px] text-[#919191] uppercase mb-1">Score</div>
                <div className={`font-bold ${LABEL_COLOR[liveAnalysis.label]}`}>{liveAnalysis.score}/100</div>
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {phase === 'error' && (
          <div className="mb-12 border border-red-500/40 p-6">
            <p className="font-mono text-xs text-red-400 uppercase">⚠ ERROR: {errorMsg}</p>
          </div>
        )}

        {/* Full Results */}
        {phase === 'results' && result && (
          <>
            {/* Score Card */}
            <div className="mb-12 border border-[#222222] p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <div className="font-mono text-[10px] text-[#919191] uppercase tracking-widest mb-4">STRENGTH_ASSESSMENT</div>
                <div className={`font-['Space_Grotesk'] text-7xl font-bold leading-none mb-2 ${LABEL_COLOR[result.analysis.label]}`}>
                  {result.analysis.score}
                  <span className="text-2xl text-[#919191] font-normal ml-1">/100</span>
                </div>
                <div className={`font-mono text-lg font-bold tracking-widest mb-4 ${LABEL_COLOR[result.analysis.label]}`}>
                  {result.analysis.label.replace('_', ' ')}
                </div>
                <div className="h-1 bg-[#222222] mb-6">
                  <div className={`h-full ${LABEL_BAR[result.analysis.label]?.color}`} style={{ width: LABEL_BAR[result.analysis.label]?.width }} />
                </div>
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between border-b border-[#222222] pb-2">
                    <span className="text-[#919191]">ENTROPY</span>
                    <span className="text-white font-bold">{result.analysis.entropy} bits</span>
                  </div>
                  <div className="flex justify-between border-b border-[#222222] pb-2">
                    <span className="text-[#919191]">EST. CRACK TIME</span>
                    <span className="text-white font-bold">{result.analysis.crackTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#919191]">PATTERNS FOUND</span>
                    <span className="text-orange-400 font-bold">{result.analysis.patterns.length}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="font-mono text-[10px] text-[#919191] uppercase tracking-widest mb-4">AI_FEEDBACK // GROQ · LLAMA-3.3-70B</div>
                {result.aiFeedback ? (
                  <>
                    <p className="font-mono text-xs text-white leading-relaxed mb-4">{result.aiFeedback.feedback}</p>
                    <div className="border-l-4 border-white pl-4">
                      <div className="font-mono text-[9px] text-[#919191] uppercase mb-1">RECOMMENDATION</div>
                      <p className="font-mono text-xs text-white">{result.aiFeedback.suggestion}</p>
                    </div>
                  </>
                ) : (
                  <p className="font-mono text-xs text-[#555] uppercase tracking-widest">
                    ⚠ AI_UNAVAILABLE — Check VITE_GEMINI_API_KEY
                  </p>
                )}
              </div>
            </div>

            {/* Pattern Flags */}
            {result.analysis.patterns.length > 0 && (
              <section>
                <h2 className="font-['Space_Grotesk'] text-xl font-bold uppercase tracking-widest mb-4">Detected_Vulnerabilities</h2>
                <div className="border border-[#222222]">
                  {result.analysis.patterns.map((pattern, i) => (
                    <div key={i} className="flex items-center gap-6 border-b border-[#222222] last:border-0 p-5 hover:bg-[#0a0a0a]">
                      <span className="font-mono text-[9px] text-[#919191]">{String(i+1).padStart(2,'0')}</span>
                      <span className="material-symbols-outlined text-orange-400 text-sm">warning</span>
                      <span className="font-mono text-xs text-white uppercase tracking-widest">{pattern.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  )
}