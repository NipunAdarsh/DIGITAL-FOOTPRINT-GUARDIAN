import React, { useState } from 'react'
import { getBreaches } from '../../utils/leakLookupApi'
import { calculateRiskScore } from '../../utils/riskScorer'
import { getStrengthScore } from '../../utils/passwordAnalyser'
import { analyzeUrl as detectPhishing } from '../../utils/phishingDetector'
import { analyzeBreaches, analyzePassword, analyzeUrl as aiAnalyzeUrl } from '../../utils/geminiApi'
import { sha256, maskEmail, maskUrl } from '../../utils/hashUtils'
import { saveScan, saveBreaches, saveRemediationSteps, savePasswordCheck, saveUrlCheck } from '../../db/queries'

const MODULE_CONFIG = [
  { id: 'breach',   label: 'BREACH_CHECK',   icon: 'manage_search', desc: 'Email breach database lookup' },
  { id: 'password', label: 'PASSWORD_AUDIT',  icon: 'rebase_edit',   desc: 'Password entropy analysis' },
  { id: 'phishing', label: 'PHISHING_DETECT', icon: 'public',        desc: 'URL threat heuristics' },
]

const StatusRow = ({ label, status, detail }) => {
  const icon = status === 'complete' ? '✓' : status === 'running' ? '↻' : status === 'error' ? '✗' : '○'
  const clr  = status === 'complete' ? 'text-white' : status === 'running' ? 'text-yellow-400 animate-pulse' : status === 'error' ? 'text-red-400' : 'text-[#555]'
  return (
    <div className="flex items-start gap-4 font-mono text-xs p-4 border-b border-[#222222] last:border-0">
      <span className={`${clr} font-bold text-sm mt-0.5`}>{icon}</span>
      <div>
        <div className={`font-bold ${clr}`}>{label}</div>
        {detail && <div className="text-[#919191] text-[10px] mt-0.5">{detail}</div>}
      </div>
    </div>
  )
}

export default function SecurityScan({ setCurrentTab }) {
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [url, setUrl]             = useState('')
  const [modules, setModules]     = useState({ breach: true, password: true, phishing: true })
  const [running, setRunning]     = useState(false)
  const [stepLog, setStepLog]     = useState([])  // [{label, status, detail}]
  const [results, setResults]     = useState(null)

  const log = (label, status, detail = '') => {
    setStepLog(prev => {
      const existing = prev.findIndex(s => s.label === label)
      const entry = { label, status, detail }
      if (existing >= 0) { const n = [...prev]; n[existing] = entry; return n }
      return [...prev, entry]
    })
  }

  const handleFullScan = async (e) => {
    e?.preventDefault()
    if (running) return
    setRunning(true)
    setStepLog([])
    setResults(null)
    const res = {}

    // BREACH SCAN
    if (modules.breach && email) {
      log('BREACH_SCAN', 'running', `Querying breach DB for ${maskEmail(email)}`)
      try {
        const emailHash   = await sha256(email.toLowerCase().trim())
        const emailMasked = maskEmail(email)
        const breaches    = await getBreaches(email)
        log('BREACH_SCAN', 'running', 'Calculating risk score...')
        const localScore  = calculateRiskScore(breaches)
        log('BREACH_SCAN', 'running', 'Generating AI analysis...')
        const aiAnalysis  = await analyzeBreaches(email, breaches, localScore.overallScore)
        const scan        = await saveScan({ emailHash, emailMasked, breachCount: breaches.length, riskScore: localScore.overallScore, riskLevel: localScore.riskLevel, aiSummary: aiAnalysis.summary })
        await saveBreaches(scan.id, breaches)
        await saveRemediationSteps(scan.id, aiAnalysis.remediationSteps)
        res.breach = { breaches, localScore, aiAnalysis }
        log('BREACH_SCAN', 'complete', `Found ${breaches.length} breach(es) · Risk: ${localScore.overallScore}/100 [${localScore.riskLevel}]`)
      } catch (err) {
        log('BREACH_SCAN', 'error', err.message)
      }
    }

    // PASSWORD AUDIT
    if (modules.password && password) {
      log('PASSWORD_AUDIT', 'running', 'Calculating entropy...')
      try {
        const analysis   = getStrengthScore(password)
        log('PASSWORD_AUDIT', 'running', 'Getting AI feedback...')
        const aiFeedback = await analyzePassword(analysis)
        await savePasswordCheck({ strengthScore: analysis.score, strengthLabel: analysis.label, entropyBits: analysis.entropy, crackTime: analysis.crackTime, patternsFound: analysis.patterns, aiFeedback: aiFeedback.feedback })
        res.password = { analysis, aiFeedback }
        log('PASSWORD_AUDIT', 'complete', `Score: ${analysis.score}/100 [${analysis.label}] · Crack: ${analysis.crackTime}`)
      } catch (err) {
        log('PASSWORD_AUDIT', 'error', err.message)
      }
    }

    // PHISHING
    if (modules.phishing && url) {
      log('PHISHING_DETECT', 'running', 'Running heuristics...')
      try {
        const urlHash    = await sha256(url)
        const urlDomain  = maskUrl(url)
        const heuristics = detectPhishing(url)
        log('PHISHING_DETECT', 'running', 'Getting AI verdict...')
        const aiVerdict  = await aiAnalyzeUrl(heuristics)
        await saveUrlCheck({ urlHash, urlDomain, verdict: heuristics.verdict, riskSignals: heuristics.signals.map(s => s.signal), signalCount: heuristics.signalCount, aiVerdict: aiVerdict.explanation })
        res.phishing = { heuristics, aiVerdict }
        log('PHISHING_DETECT', 'complete', `Verdict: ${heuristics.verdict} · ${heuristics.signalCount} signal(s)`)
      } catch (err) {
        log('PHISHING_DETECT', 'error', err.message)
      }
    }

    setResults(res)
    setRunning(false)
  }

  return (
    <main className="flex-1 overflow-auto bg-black">
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '80px 80px' }} />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="mb-12 border-b border-[#222222] pb-8">
          <p className="font-mono text-[10px] text-[#919191] mb-3 uppercase tracking-[0.3em]">SECURITY / FULL_SCAN</p>
          <h1 className="font-['Space_Grotesk'] text-6xl font-bold tracking-tighter uppercase leading-none mb-3">
            Security<br/>Scan
          </h1>
          <p className="font-mono text-xs text-[#919191]">
            COMPREHENSIVE DIGITAL FOOTPRINT AUDIT — BREACH · PASSWORD · PHISHING — IN ONE SWEEP
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Form */}
          <form onSubmit={handleFullScan} className="space-y-6">
            {/* Module toggles */}
            <div>
              <div className="font-mono text-[9px] text-[#919191] uppercase tracking-widest mb-3">Active_Modules</div>
              <div className="space-y-2">
                {MODULE_CONFIG.map(m => (
                  <label key={m.id} className="flex items-center gap-3 cursor-pointer group">
                    <div
                      onClick={() => setModules(v => ({ ...v, [m.id]: !v[m.id] }))}
                      className={`w-4 h-4 border flex items-center justify-center transition-all cursor-pointer ${modules[m.id] ? 'bg-white border-white' : 'border-[#444444]'}`}
                    >
                      {modules[m.id] && <span className="text-black text-[10px] font-bold">✓</span>}
                    </div>
                    <div>
                      <div className="font-mono text-xs text-white group-hover:text-white">{m.label}</div>
                      <div className="font-mono text-[9px] text-[#919191]">{m.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Inputs */}
            {modules.breach && (
              <div>
                <label className="block font-mono text-[9px] text-[#919191] uppercase tracking-widest mb-1">Email_Address</label>
                <input value={email} onChange={e => setEmail(e.target.value)} type="email"
                  className="w-full bg-black border-b border-white text-white font-mono text-sm p-3 focus:outline-none placeholder:text-[#333]"
                  placeholder="target@domain.com" />
              </div>
            )}
            {modules.password && (
              <div>
                <label className="block font-mono text-[9px] text-[#919191] uppercase tracking-widest mb-1">Password_String</label>
                <input value={password} onChange={e => setPassword(e.target.value)} type="password"
                  className="w-full bg-black border-b border-white text-white font-mono text-sm p-3 focus:outline-none placeholder:text-[#333] tracking-widest"
                  placeholder="••••••••••••" />
              </div>
            )}
            {modules.phishing && (
              <div>
                <label className="block font-mono text-[9px] text-[#919191] uppercase tracking-widest mb-1">URL_String</label>
                <input value={url} onChange={e => setUrl(e.target.value)} type="text"
                  className="w-full bg-black border-b border-white text-white font-mono text-sm p-3 focus:outline-none placeholder:text-[#333]"
                  placeholder="https://example.com" />
              </div>
            )}

            <button
              type="submit"
              disabled={running}
              className="w-full bg-white text-black font-['Space_Grotesk'] font-bold uppercase tracking-[0.2em] py-4 hover:bg-[#d4d4d4] transition-colors disabled:opacity-50"
            >
              {running ? 'SCANNING...' : 'EXECUTE_FULL_SCAN'}
            </button>
          </form>

          {/* Progress Log */}
          <div className="border border-[#222222]">
            <div className="p-4 border-b border-[#222222] font-mono text-[10px] text-[#919191] uppercase tracking-widest">
              Execution_Log
            </div>
            {stepLog.length === 0 ? (
              <div className="p-8 text-center font-mono text-xs text-[#555]">AWAITING_INITIATION...</div>
            ) : (
              stepLog.map((s, i) => <StatusRow key={i} {...s} />)
            )}
          </div>
        </div>

        {/* Results Summary */}
        {results && Object.keys(results).length > 0 && (
          <section>
            <h2 className="font-['Space_Grotesk'] text-xl font-bold uppercase tracking-widest mb-6 border-t border-[#222222] pt-8">Scan_Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-[#222222]">
              {results.breach && (
                <div className="border-r border-[#222222] p-6">
                  <div className="font-mono text-[9px] text-[#919191] uppercase tracking-widest mb-3">BREACH_RESULTS</div>
                  <div className="font-['Space_Grotesk'] text-4xl font-bold text-white">{results.breach.localScore.overallScore}</div>
                  <div className="font-mono text-[10px] text-[#919191] mt-1">RISK SCORE / {results.breach.localScore.riskLevel}</div>
                  <div className="mt-4 font-mono text-xs text-[#919191]">{results.breach.breaches.length} breach(es) found</div>
                  <button onClick={() => setCurrentTab?.('scanner')} className="mt-4 w-full font-mono text-[10px] border border-[#333] py-2 text-[#919191] hover:border-white hover:text-white transition-all">
                    VIEW FULL REPORT →
                  </button>
                </div>
              )}
              {results.password && (
                <div className="border-r border-[#222222] p-6">
                  <div className="font-mono text-[9px] text-[#919191] uppercase tracking-widest mb-3">PASSWORD_AUDIT</div>
                  <div className="font-['Space_Grotesk'] text-4xl font-bold text-white">{results.password.analysis.score}</div>
                  <div className="font-mono text-[10px] text-[#919191] mt-1">SCORE / {results.password.analysis.label}</div>
                  <div className="mt-4 font-mono text-xs text-[#919191]">Crack: {results.password.analysis.crackTime}</div>
                  <button onClick={() => setCurrentTab?.('password')} className="mt-4 w-full font-mono text-[10px] border border-[#333] py-2 text-[#919191] hover:border-white hover:text-white transition-all">
                    VIEW FULL REPORT →
                  </button>
                </div>
              )}
              {results.phishing && (
                <div className="p-6">
                  <div className="font-mono text-[9px] text-[#919191] uppercase tracking-widest mb-3">PHISHING_VERDICT</div>
                  <div className={`font-['Space_Grotesk'] text-3xl font-bold ${results.phishing.heuristics.verdict === 'DANGEROUS' ? 'text-red-400' : results.phishing.heuristics.verdict === 'SUSPICIOUS' ? 'text-yellow-400' : 'text-white'}`}>
                    {results.phishing.heuristics.verdict?.replace('_', ' ')}
                  </div>
                  <div className="mt-4 font-mono text-xs text-[#919191]">{results.phishing.heuristics.signalCount} signal(s) detected</div>
                  <button onClick={() => setCurrentTab?.('phishing')} className="mt-4 w-full font-mono text-[10px] border border-[#333] py-2 text-[#919191] hover:border-white hover:text-white transition-all">
                    VIEW FULL REPORT →
                  </button>
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
