import React, { useState, useEffect } from 'react'
import { getDataBrokers, updateBrokerStatus, addCustomBroker } from '../../db/queries'

const STATUS_CONFIG = {
  NOT_REQUESTED: { label: 'NOT REQUESTED',  color: 'text-[#919191] border-[#333333]' },
  PENDING:       { label: 'PENDING',         color: 'text-yellow-400 border-yellow-400/30' },
  IN_PROGRESS:   { label: 'IN PROGRESS',     color: 'text-orange-400 border-orange-400/30' },
  CONFIRMED:     { label: 'CONFIRMED ✓',     color: 'text-white border-white/30' },
}

const REMOVAL_GUIDE = [
  { broker: 'Spokeo',           url: 'https://www.spokeo.com/optout', steps: 'Search your name → Click listing → Privacy button → Submit' },
  { broker: 'Whitepages',       url: 'https://www.whitepages.com/suppression_requests', steps: 'Find listing → Select "Remove Profile" → Verify via email' },
  { broker: 'BeenVerified',     url: 'https://www.beenverified.com/app/optout/search', steps: 'Search name → Identify listing → Submit opt-out form' },
  { broker: 'Intelius',         url: 'https://intelius.com/opt-out/', steps: 'Enter info → Search → Select profile → Request removal' },
  { broker: 'Radaris',          url: 'https://radaris.com/control/privacy', steps: 'Login/signup required → Privacy settings → Remove data' },
  { broker: 'ZoomInfo',         url: 'https://www.zoominfo.com/update/remove-profile', steps: 'Search your profile → Click opt-out → Verify via email' },
]

export default function DataBrokers({ setCurrentTab }) {
  const [brokers, setBrokers]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [newBroker, setNewBroker] = useState({ name: '', category: '', data: '' })
  const [adding, setAdding]     = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getDataBrokers()
      setBrokers(data)
    } catch (err) {
      setError(err.message || 'Failed to load brokers.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleStatusChange = async (id, newStatus) => {
    try {
      const updated = await updateBrokerStatus(id, newStatus)
      setBrokers(prev => prev.map(b => b.id === id ? updated : b))
    } catch (err) {
      console.error('[DataBrokers] status update failed:', err)
    }
  }

  const handleAddBroker = async (e) => {
    e?.preventDefault()
    if (!newBroker.name.trim()) return
    setAdding(true)
    try {
      const added = await addCustomBroker({
        brokerName: newBroker.name,
        brokerCategory: newBroker.category || 'Custom',
        dataFound: newBroker.data ? newBroker.data.split(',').map(d => d.trim()) : [],
      })
      setBrokers(prev => [...prev, added])
      setNewBroker({ name: '', category: '', data: '' })
    } catch (err) {
      console.error('[DataBrokers] add failed:', err)
    } finally {
      setAdding(false)
    }
  }

  const counts = {
    total:     brokers.length,
    requested: brokers.filter(b => b.removal_status !== 'NOT_REQUESTED').length,
    confirmed: brokers.filter(b => b.removal_status === 'CONFIRMED').length,
    pending:   brokers.filter(b => ['PENDING', 'IN_PROGRESS'].includes(b.removal_status)).length,
  }

  return (
    <main className="flex-1 overflow-auto bg-black">
      <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '80px 80px' }} />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="mb-12 border-b border-[#222222] pb-8 flex flex-col md:flex-row items-end justify-between">
          <div>
            <p className="font-mono text-[10px] text-[#919191] mb-3 uppercase tracking-[0.3em]">PRIVACY / DATA_BROKERS</p>
            <h1 className="font-['Space_Grotesk'] text-6xl font-bold tracking-tighter uppercase leading-none mb-3">
              Data Broker<br/>Removal
            </h1>
            <p className="font-mono text-xs text-[#919191] max-w-xs">
              TRACK OPT-OUT STATUS ACROSS PERSONAL DATA AGGREGATORS AND PEOPLE-SEARCH DATABASES
            </p>
          </div>
          <button onClick={load} className="mt-6 md:mt-0 font-mono text-[10px] text-[#919191] border border-[#333] px-4 py-2 hover:border-white hover:text-white transition-all uppercase tracking-widest">
            ↺ REFRESH
          </button>
        </div>

        {/* Stats */}
        <div className="mb-12 grid grid-cols-2 md:grid-cols-4 gap-0 border border-[#222222]">
          {[
            { label: 'Brokers_Tracked',  value: counts.total },
            { label: 'Removals_Requested', value: counts.requested },
            { label: 'Confirmed_Removed', value: counts.confirmed },
            { label: 'Pending_Action',   value: counts.pending },
          ].map((s, i, arr) => (
            <div key={s.label} className={`p-6 ${i < arr.length - 1 ? 'border-r border-[#222222]' : ''}`}>
              <div className="font-mono text-[9px] text-[#919191] uppercase tracking-widest mb-3">{s.label}</div>
              <div className="font-['Space_Grotesk'] text-4xl font-bold text-white">{s.value}</div>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-8 border border-red-500/40 p-6">
            <p className="font-mono text-xs text-red-400">⚠ DB_ERROR: {error}</p>
          </div>
        )}

        {/* Broker Table */}
        <section className="mb-12">
          <h2 className="font-['Space_Grotesk'] text-xl font-bold uppercase tracking-widest mb-4">Broker_Status_Tracker</h2>
          {loading ? (
            <div className="border border-[#222222] p-8 text-center font-mono text-xs text-[#919191] animate-pulse">LOADING_BROKERS...</div>
          ) : (
            <div className="border border-[#222222]">
              {/* Header */}
              <div className="grid grid-cols-12 font-mono text-[9px] text-[#919191] uppercase bg-[#080808] border-b border-[#222222]">
                <div className="col-span-2 p-4 border-r border-[#222222] tracking-widest">Broker</div>
                <div className="col-span-2 p-4 border-r border-[#222222] tracking-widest">Category</div>
                <div className="col-span-3 p-4 border-r border-[#222222] tracking-widest">Data Found</div>
                <div className="col-span-2 p-4 border-r border-[#222222] tracking-widest">Status</div>
                <div className="col-span-3 p-4 tracking-widest">Action</div>
              </div>
              {brokers.map(broker => {
                const sc = STATUS_CONFIG[broker.removal_status] || STATUS_CONFIG.NOT_REQUESTED
                return (
                  <div key={broker.id} className="grid grid-cols-12 font-mono text-xs border-b border-[#222222] last:border-0 hover:bg-[#050505] transition-colors">
                    <div className="col-span-2 p-5 border-r border-[#222222] text-white font-bold">{broker.broker_name}</div>
                    <div className="col-span-2 p-5 border-r border-[#222222] text-[#919191] text-[10px]">{broker.broker_category}</div>
                    <div className="col-span-3 p-5 border-r border-[#222222]">
                      <div className="flex flex-wrap gap-1">
                        {(broker.data_found || []).map((d, i) => (
                          <span key={i} className="text-[9px] px-1.5 py-0.5 border border-[#333] text-[#919191]">{d}</span>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-2 p-5 border-r border-[#222222]">
                      <span className={`text-[9px] font-bold px-2 py-1 border ${sc.color}`}>{sc.label}</span>
                    </div>
                    <div className="col-span-3 p-5">
                      <select
                        value={broker.removal_status}
                        onChange={e => handleStatusChange(broker.id, e.target.value)}
                        className="bg-black border border-[#333] text-white font-mono text-[10px] px-2 py-1 focus:outline-none focus:border-white w-full"
                      >
                        <option value="NOT_REQUESTED">Not Requested</option>
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="CONFIRMED">Confirmed</option>
                      </select>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Removal Guide */}
        <section className="mb-12">
          <h2 className="font-['Space_Grotesk'] text-xl font-bold uppercase tracking-widest mb-4">Opt-Out Guide</h2>
          <div className="border border-[#222222]">
            {REMOVAL_GUIDE.map((g, i) => (
              <div key={i} className="grid grid-cols-12 border-b border-[#222222] last:border-0 hover:bg-[#050505] transition-colors">
                <div className="col-span-2 p-5 border-r border-[#222222] font-mono text-xs text-white font-bold">{g.broker}</div>
                <div className="col-span-5 p-5 border-r border-[#222222] font-mono text-[10px] text-[#919191]">{g.steps}</div>
                <div className="col-span-5 p-5">
                  <a href={g.url} target="_blank" rel="noopener noreferrer"
                    className="font-mono text-[10px] text-white underline hover:text-[#919191] transition-colors break-all">
                    {g.url}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Add Custom Broker */}
        <section>
          <h2 className="font-['Space_Grotesk'] text-xl font-bold uppercase tracking-widest mb-4">Add_Custom_Broker</h2>
          <form onSubmit={handleAddBroker} className="border border-[#222222] p-6">
            <div className="grid grid-cols-3 gap-6 mb-4">
              <div>
                <label className="block font-mono text-[9px] text-[#919191] uppercase tracking-widest mb-1">Broker_Name *</label>
                <input value={newBroker.name} onChange={e => setNewBroker(v => ({ ...v, name: e.target.value }))}
                  className="w-full bg-black border-b border-white text-white font-mono text-sm p-2 focus:outline-none"
                  placeholder="BrokerName" />
              </div>
              <div>
                <label className="block font-mono text-[9px] text-[#919191] uppercase tracking-widest mb-1">Category</label>
                <input value={newBroker.category} onChange={e => setNewBroker(v => ({ ...v, category: e.target.value }))}
                  className="w-full bg-black border-b border-[#444] text-white font-mono text-sm p-2 focus:outline-none focus:border-white"
                  placeholder="People Search" />
              </div>
              <div>
                <label className="block font-mono text-[9px] text-[#919191] uppercase tracking-widest mb-1">Data Found (comma-sep)</label>
                <input value={newBroker.data} onChange={e => setNewBroker(v => ({ ...v, data: e.target.value }))}
                  className="w-full bg-black border-b border-[#444] text-white font-mono text-sm p-2 focus:outline-none focus:border-white"
                  placeholder="Email, Phone, Address" />
              </div>
            </div>
            <button type="submit" disabled={!newBroker.name || adding}
              className="bg-white text-black font-mono text-[10px] px-8 py-3 tracking-[0.2em] hover:bg-[#d4d4d4] transition-colors disabled:opacity-50">
              {adding ? 'ADDING...' : 'ADD_BROKER'}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
