import React, { useState, useEffect } from 'react'
import { getHighRiskScans, getRemediationStepsForScan } from '../../db/queries'

const RISK_COLOR = {
  LOW:      'text-white border-white/20',
  MEDIUM:   'text-yellow-400 border-yellow-400/30',
  HIGH:     'text-orange-400 border-orange-400/30',
  CRITICAL: 'text-red-400 border-red-500/40',
}

export default function ActiveThreats({ setCurrentTab }) {
  const [scans, setScans]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null)
  const [steps, setSteps]       = useState([])
  const [loadingSteps, setLoadingSteps] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getHighRiskScans(20)
        setScans(data)
        if (data.length > 0) loadSteps(data[0])
      } catch (err) {
        console.warn('[ActiveThreats]', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const loadSteps = async (scan) => {
    setSelected(scan)
    setLoadingSteps(true)
    try {
      const s = await getRemediationStepsForScan(scan.id)
      setSteps(s)
    } catch {
      setSteps([])
    } finally {
      setLoadingSteps(false)
    }
  }

  const criticalCount = scans.filter(s => s.risk_level === 'CRITICAL').length
  const highCount     = scans.filter(s => s.risk_level === 'HIGH').length

  return (
    <main className="flex-1 overflow-auto bg-black">
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '80px 80px' }} />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="mb-12 border-b border-[#222222] pb-8 flex flex-col md:flex-row items-end justify-between">
          <div>
            <p className="font-mono text-[10px] text-[#919191] mb-3 uppercase tracking-[0.3em]">SECURITY / ACTIVE_THREATS</p>
            <h1 className="font-['Space_Grotesk'] text-6xl font-bold tracking-tighter uppercase leading-none mb-3">
              Active<br/>Threats
            </h1>
            <p className="font-mono text-xs text-[#919191] max-w-xs">
              HIGH AND CRITICAL RISK SCANS REQUIRING IMMEDIATE REMEDIATION
            </p>
          </div>
          <div className="mt-6 md:mt-0 font-mono text-[10px]">
            <div className="text-red-400 font-bold">{criticalCount} CRITICAL</div>
            <div className="text-orange-400">{highCount} HIGH RISK</div>
          </div>
        </div>

        {/* Alert Banner */}
        {!loading && (criticalCount > 0 || highCount > 0) && (
          <div className="mb-12 border-l-4 border-red-500 bg-red-500/5 p-6">
            <div className="font-mono text-[10px] text-red-400 uppercase tracking-widest mb-1">⚠ CRITICAL_ALERT</div>
            <div className="font-mono text-xs text-white">
              {criticalCount + highCount} HIGH-SEVERITY THREAT{criticalCount + highCount !== 1 ? 'S' : ''} REQUIRE IMMEDIATE ACTION
            </div>
          </div>
        )}

        {loading && (
          <div className="border border-[#222222] p-10 text-center font-mono text-xs text-[#919191] animate-pulse">
            QUERYING_THREAT_DATABASE...
          </div>
        )}

        {!loading && scans.length === 0 && (
          <div className="border border-[#222222] p-16 text-center">
            <div className="font-['Space_Grotesk'] text-3xl font-bold text-white mb-3">✓ ALL_CLEAR</div>
            <p className="font-mono text-xs text-[#919191]">No high or critical risk scans found.</p>
            <button
              onClick={() => setCurrentTab?.('scanner')}
              className="mt-6 bg-white text-black font-mono text-[10px] px-6 py-3 tracking-[0.2em] hover:bg-[#d4d4d4] transition-colors"
            >
              RUN BREACH SCAN →
            </button>
          </div>
        )}

        {!loading && scans.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-[#222222]">
            {/* Left: Threat List */}
            <div className="border-r border-[#222222]">
              <div className="p-4 border-b border-[#222222] font-mono text-[10px] text-[#919191] uppercase tracking-widest">
                Threat_Ledger ({scans.length})
              </div>
              <div className="overflow-auto max-h-[600px]">
                {scans.map(scan => (
                  <button
                    key={scan.id}
                    onClick={() => loadSteps(scan)}
                    className={`w-full text-left px-5 py-4 border-b border-[#222222] hover:bg-[#0a0a0a] transition-colors ${selected?.id === scan.id ? 'bg-white text-black' : ''}`}
                  >
                    <div className={`font-mono text-xs font-bold ${selected?.id === scan.id ? 'text-black' : 'text-white'}`}>
                      {scan.email_masked}
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className={`font-mono text-[9px] ${selected?.id === scan.id ? 'text-black/60' : 'text-[#919191]'}`}>
                        {new Date(scan.created_at).toLocaleDateString()}
                      </span>
                      <span className={`font-mono text-[10px] font-bold ${selected?.id === scan.id ? 'text-black' : RISK_COLOR[scan.risk_level]?.split(' ')[0]}`}>
                        {scan.risk_score} — {scan.risk_level}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Remediation Steps */}
            <div className="col-span-2 p-6">
              {!selected ? (
                <div className="text-center mt-12 font-mono text-xs text-[#919191]">Select a threat from the left</div>
              ) : (
                <>
                  <div className="mb-6">
                    <div className="font-mono text-[9px] text-[#919191] uppercase tracking-widest mb-1">SELECTED_TARGET</div>
                    <div className="font-['Space_Grotesk'] text-2xl font-bold text-white">{selected.email_masked}</div>
                    <div className="flex gap-4 mt-2 font-mono text-xs text-[#919191]">
                      <span>Risk Score: <span className="text-white font-bold">{selected.risk_score}</span></span>
                      <span>Breaches: <span className="text-white font-bold">{selected.breach_count}</span></span>
                      <span>Level: <span className={RISK_COLOR[selected.risk_level]?.split(' ')[0] + ' font-bold'}>{selected.risk_level}</span></span>
                    </div>
                    {selected.ai_summary && (
                      <p className="font-mono text-xs text-[#c6c6c6] mt-3 leading-relaxed border-l-4 border-[#333] pl-4">
                        {selected.ai_summary}
                      </p>
                    )}
                  </div>

                  <div className="border-t border-[#222222] pt-6">
                    <div className="font-mono text-[10px] text-[#919191] uppercase tracking-widest mb-4">Remediation_Steps</div>
                    {loadingSteps ? (
                      <div className="font-mono text-xs text-[#919191] animate-pulse">LOADING STEPS...</div>
                    ) : steps.length === 0 ? (
                      <div className="font-mono text-xs text-[#919191]">No remediation steps recorded for this scan.</div>
                    ) : (
                      <div className="space-y-0 border border-[#222222]">
                        {steps.map((step, i) => {
                          const pc = step.priority === 'CRITICAL' ? 'text-red-400' : step.priority === 'HIGH' ? 'text-orange-400' : 'text-yellow-400'
                          return (
                            <div key={step.id} className="grid grid-cols-12 text-xs font-mono border-b border-[#222222] last:border-0 hover:bg-[#0a0a0a]">
                              <div className="col-span-1 p-4 border-r border-[#222222] text-[#919191] text-center">
                                {String(step.step_order).padStart(2, '0')}
                              </div>
                              <div className={`col-span-2 p-4 border-r border-[#222222] font-bold text-[10px] ${pc}`}>{step.priority}</div>
                              <div className="col-span-7 p-4 border-r border-[#222222] text-white">{step.action}</div>
                              <div className="col-span-2 p-4 text-[#919191] text-[10px]">{step.time_to_fix}</div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
