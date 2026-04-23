import React, { useState, useEffect } from 'react'
import { getPlatformStats, getRecentScans } from '../../db/queries'

const StatCard = ({ label, value, sub }) => (
  <div className="border border-[#222222] p-6 hover:bg-[#0a0a0a] transition-colors">
    <div className="font-mono text-[9px] text-[#919191] uppercase tracking-widest mb-3">{label}</div>
    <div className="font-['Space_Grotesk'] text-4xl font-bold text-white leading-none">{value}</div>
    {sub && <div className="font-mono text-[9px] text-[#919191] mt-2 uppercase">{sub}</div>}
  </div>
)

export default function Dashboard({ setCurrentTab }) {
  const [stats, setStats]         = useState(null)
  const [recentScans, setRecent]  = useState([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [s, r] = await Promise.all([getPlatformStats(), getRecentScans(8)])
        setStats(s)
        setRecent(r)
      } catch (err) {
        console.warn('[Dashboard]', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const RISK_COLOR = { LOW: 'text-white', MEDIUM: 'text-yellow-400', HIGH: 'text-orange-400', CRITICAL: 'text-red-400' }

  // Dynamically check which services are configured
  const groqActive       = !!(import.meta.env.VITE_GROQ_API_KEY && import.meta.env.VITE_GROQ_API_KEY !== 'YOUR_GROQ_API_KEY_HERE')
  const leakLookupActive = !!(import.meta.env.VITE_LEAK_LOOKUP_API_KEY && import.meta.env.VITE_LEAK_LOOKUP_API_KEY !== 'PASTE_YOUR_LEAK_LOOKUP_KEY_HERE')

  return (
    <main className="flex-1 overflow-auto bg-black">
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '80px 80px' }} />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="mb-12 border-b border-[#222222] pb-8 flex flex-col md:flex-row items-end justify-between">
          <div>
            <p className="font-mono text-[10px] text-[#919191] mb-3 uppercase tracking-[0.3em]">FORENSIC_ARCHIVE_v1.0 / OVERVIEW</p>
            <h1 className="font-['Space_Grotesk'] text-6xl font-bold tracking-tighter uppercase leading-none mb-3">
              Guardian<br/>Dashboard
            </h1>
            <p className="font-mono text-xs text-[#919191] max-w-xs">
              REAL-TIME PLATFORM ANALYTICS · LIVE POSTGRESQL DATA
            </p>
          </div>
          <div className="mt-6 md:mt-0 flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 font-mono text-[10px]">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              <span className="text-white">DB_CONNECTED</span>
            </div>
            <div className="font-mono text-[9px] text-[#919191]">REGION: AP-SOUTHEAST-01</div>
          </div>
        </div>

        {/* Stats Grid */}
        <section className="mb-12 grid grid-cols-2 md:grid-cols-4 gap-0 border border-[#222222]">
          <div className="border-r border-[#222222]">
            <StatCard label="Total_Scans" value={loading ? '—' : (stats?.total_scans ?? 0)} sub="lifetime" />
          </div>
          <div className="border-r border-[#222222]">
            <StatCard label="Breaches_Found" value={loading ? '—' : (stats?.total_breaches_found ?? 0)} sub="across all scans" />
          </div>
          <div className="border-r border-[#222222]">
            <StatCard label="Avg_Risk_Score" value={loading ? '—' : (stats?.average_risk_score ?? 0)} sub="/ 100" />
          </div>
          <div>
            <StatCard label="Critical_Alerts" value={loading ? '—' : (stats?.critical_risk_users ?? 0)} sub="users at risk" />
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'BREACH_SCANNER', desc: 'Email breach lookup', tab: 'scanner', icon: 'manage_search' },
            { label: 'PWD_ANALYSER',   desc: 'Password strength audit', tab: 'password', icon: 'rebase_edit' },
            { label: 'PHISH_DETECT',   desc: 'URL threat detection', tab: 'phishing', icon: 'public' },
          ].map(item => (
            <button
              key={item.tab}
              onClick={() => setCurrentTab?.(item.tab)}
              className="border border-[#222222] p-6 text-left hover:bg-white hover:text-black group transition-all"
            >
              <span className="material-symbols-outlined text-2xl text-[#919191] group-hover:text-black mb-3 block">{item.icon}</span>
              <div className="font-['Space_Grotesk'] font-bold uppercase tracking-widest text-sm mb-1">{item.label}</div>
              <div className="font-mono text-[10px] text-[#919191] group-hover:text-black/60">{item.desc}</div>
            </button>
          ))}
        </section>

        {/* Two-col layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-[#222222]">
          {/* Recent Activity */}
          <div className="col-span-2 border-r border-[#222222]">
            <div className="flex justify-between items-center p-6 border-b border-[#222222]">
              <h2 className="font-['Space_Grotesk'] font-bold uppercase tracking-widest text-sm">Recent_Activity</h2>
              <button onClick={() => setCurrentTab?.('history')} className="font-mono text-[10px] text-[#919191] hover:text-white transition-colors">
                VIEW ALL →
              </button>
            </div>
            {loading ? (
              <div className="p-8 text-center font-mono text-xs text-[#919191] animate-pulse">LOADING_RECORDS...</div>
            ) : recentScans.length === 0 ? (
              <div className="p-8 text-center">
                <div className="font-mono text-xs text-[#919191]">NO SCANS YET</div>
                <button onClick={() => setCurrentTab?.('scanner')} className="mt-4 font-mono text-[10px] text-white border border-[#333] px-4 py-2 hover:bg-white hover:text-black transition-all">
                  RUN FIRST SCAN →
                </button>
              </div>
            ) : (
              <div>
                {recentScans.map((scan, i) => (
                  <div key={scan.id} className="flex items-center justify-between px-6 py-4 border-b border-[#222222] last:border-0 hover:bg-[#080808] transition-colors">
                    <div>
                      <div className="font-mono text-xs text-white font-bold">{scan.email_masked}</div>
                      <div className="font-mono text-[9px] text-[#919191] mt-0.5">
                        {new Date(scan.created_at).toLocaleString()} · {scan.breach_count} breach{scan.breach_count !== 1 ? 'es' : ''}
                      </div>
                    </div>
                    <div className={`font-mono text-[10px] font-bold ${RISK_COLOR[scan.risk_level]}`}>
                      {scan.risk_score} <span className="text-[8px] font-normal text-[#919191]">{scan.risk_level}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Side Panel */}
          <div>
            <div className="p-6 border-b border-[#222222]">
              <h2 className="font-['Space_Grotesk'] font-bold uppercase tracking-widest text-sm">System_Status</h2>
            </div>
            <div className="p-6 space-y-4 font-mono text-xs">
              {[
                { key: 'DB_CONNECTION',   val: 'ACTIVE',                          ok: true },
                { key: 'BREACH_ENGINE',   val: leakLookupActive ? 'LIVE' : 'NO_KEY',  ok: leakLookupActive },
                { key: 'AI_ENGINE',       val: groqActive ? 'GROQ_LLAMA3' : 'NO_KEY', ok: groqActive },
                { key: 'PWD_CHECKS',        val: stats ? String(stats.password_checks_done) : '—', ok: true },
                { key: 'URL_CHECKS',        val: stats ? String(stats.url_checks_done) : '—', ok: true },
              ].map(item => (
                <div key={item.key} className="flex justify-between items-center">
                  <span className="text-[#919191] text-[9px]">{item.key}</span>
                  <span className={item.ok ? 'text-white' : 'text-yellow-400'}>{item.val}</span>
                </div>
              ))}
            </div>
            <div className="px-6 pb-6">
              <button
                onClick={() => setCurrentTab?.('scan')}
                className="w-full bg-white text-black font-mono text-[10px] py-3 tracking-[0.2em] hover:bg-[#d4d4d4] transition-colors font-bold"
              >
                INITIATE_FULL_SCAN
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
