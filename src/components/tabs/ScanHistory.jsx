import React, { useState, useEffect } from 'react'
import { getRecentScans } from '../../db/queries'

export default function ScanHistory({ setCurrentTab }) {
  const [scans, setScans]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [filter, setFilter]     = useState('ALL')   // ALL | LOW | MEDIUM | HIGH | CRITICAL

  const loadScans = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getRecentScans(50)
      setScans(data)
    } catch (err) {
      setError(err.message || 'Failed to load scan history.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadScans() }, [])

  const filtered = filter === 'ALL' ? scans : scans.filter(s => s.risk_level === filter)

  const RISK_COLOR = {
    LOW:      'text-white border-white/30',
    MEDIUM:   'text-yellow-400 border-yellow-400/30',
    HIGH:     'text-orange-400 border-orange-400/30',
    CRITICAL: 'text-red-400 border-red-500/30',
  }

  return (
    <main className="flex-1 overflow-auto bg-black">
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '80px 80px' }} />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="mb-12 border-b border-[#222222] pb-8 flex flex-col md:flex-row items-end justify-between">
          <div>
            <p className="font-mono text-[10px] text-[#919191] mb-3 uppercase tracking-[0.3em]">Module_04 / SCAN_HISTORY</p>
            <h1 className="font-['Space_Grotesk'] text-6xl font-bold tracking-tighter uppercase leading-none mb-3">
              Scan<br/>History
            </h1>
            <p className="font-mono text-xs text-[#919191] max-w-xs">
              LIVE AUDIT LEDGER — ALL EMAIL BREACH SCANS STORED IN POSTGRESQL DATABASE
            </p>
          </div>
          <div className="mt-6 md:mt-0 flex flex-col items-end gap-2">
            <button onClick={loadScans} className="font-mono text-[10px] text-[#919191] hover:text-white border border-[#333] px-4 py-2 hover:border-white transition-all uppercase tracking-widest">
              ↺ REFRESH
            </button>
            <div className="font-mono text-[10px] text-[#919191]">RECORDS: <span className="text-white">{scans.length}</span></div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-2">
          {['ALL', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`font-mono text-[10px] tracking-widest px-4 py-2 border transition-all ${
                filter === f ? 'bg-white text-black border-white' : 'text-[#919191] border-[#333333] hover:border-white hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="border border-[#222222] p-10 text-center">
            <div className="font-mono text-xs text-[#919191] animate-pulse">QUERYING_DATABASE...</div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="border border-red-500/40 p-6">
            <p className="font-mono text-xs text-red-400">⚠ DATABASE_ERROR: {error}</p>
            <p className="font-mono text-[9px] text-[#919191] mt-2">Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in .env.local</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filtered.length === 0 && (
          <div className="border border-[#222222] p-16 text-center">
            <div className="font-['Space_Grotesk'] text-3xl font-bold text-white mb-3">NO_RECORDS</div>
            <p className="font-mono text-xs text-[#919191]">Run a breach scan to populate the ledger.</p>
            <button
              onClick={() => setCurrentTab?.('scanner')}
              className="mt-6 bg-white text-black font-mono text-[10px] px-6 py-3 tracking-[0.2em] hover:bg-[#d4d4d4] transition-colors">
              GO_TO_BREACH_SCANNER
            </button>
          </div>
        )}

        {/* Table */}
        {!loading && !error && filtered.length > 0 && (
          <div className="border border-[#222222]">
            <div className="grid grid-cols-12 font-mono text-[10px] text-[#919191] uppercase bg-[#080808] border-b border-[#222222]">
              <div className="col-span-3 p-4 border-r border-[#222222] tracking-widest">Timestamp</div>
              <div className="col-span-3 p-4 border-r border-[#222222] tracking-widest">Email_Masked</div>
              <div className="col-span-2 p-4 border-r border-[#222222] tracking-widest">Breaches</div>
              <div className="col-span-2 p-4 border-r border-[#222222] tracking-widest">Risk_Score</div>
              <div className="col-span-2 p-4 tracking-widest">Risk_Level</div>
            </div>
            {filtered.map((scan, i) => (
              <div key={scan.id} className="grid grid-cols-12 font-mono text-xs hover:bg-white hover:text-black transition-colors group cursor-crosshair border-b border-[#222222] last:border-0">
                <div className="col-span-3 p-5 border-r border-[#222222] group-hover:border-transparent text-[#919191] group-hover:text-black">
                  {new Date(scan.created_at).toLocaleString()}
                </div>
                <div className="col-span-3 p-5 border-r border-[#222222] group-hover:border-transparent font-bold">
                  {scan.email_masked}
                </div>
                <div className="col-span-2 p-5 border-r border-[#222222] group-hover:border-transparent text-center">
                  {scan.breach_count}
                </div>
                <div className="col-span-2 p-5 border-r border-[#222222] group-hover:border-transparent text-center font-bold">
                  {scan.risk_score}
                </div>
                <div className="col-span-2 p-5">
                  <span className={`text-[9px] font-bold px-2 py-1 border ${RISK_COLOR[scan.risk_level]} group-hover:text-black group-hover:border-black`}>
                    {scan.risk_level}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}