import React, { useState } from 'react'

// Core 4 tabs (existing)
import BreachScanner from './components/tabs/BreachScanner'
import PasswordAnalyser from './components/tabs/PasswordAnalyser'
import PhishingDetector from './components/tabs/PhishingDetector'
import ScanHistory from './components/tabs/ScanHistory'

// New 4 missing pages
import Dashboard from './components/tabs/Dashboard'
import ActiveThreats from './components/tabs/ActiveThreats'
import SecurityScan from './components/tabs/SecurityScan'
import DataBrokers from './components/tabs/DataBrokers'

function App() {
  const [currentTab, setCurrentTab] = useState('dashboard')

  const navItems = [
    { id: 'dashboard',    label: 'DASHBOARD',    icon: 'grid_view' },
    { id: 'threats',      label: 'ACTIVE_THREATS', icon: 'warning' },
    { id: 'scan',         label: 'SECURITY_SCAN', icon: 'radar' },
    { id: 'scanner',      label: 'BREACH_SCANNER', icon: 'manage_search' },
    { id: 'password',     label: 'PWD_ANALYSER',  icon: 'rebase_edit' },
    { id: 'phishing',     label: 'PHISH_DETECT',  icon: 'public' },
    { id: 'history',      label: 'SCAN_HISTORY',  icon: 'folder_open' },
    { id: 'brokers',      label: 'DATA_BROKERS',  icon: 'receipt_long' },
  ]

  const renderActiveTab = () => {
    switch (currentTab) {
      case 'dashboard':  return <Dashboard setCurrentTab={setCurrentTab} />
      case 'threats':    return <ActiveThreats setCurrentTab={setCurrentTab} />
      case 'scan':       return <SecurityScan setCurrentTab={setCurrentTab} />
      case 'scanner':    return <BreachScanner setCurrentTab={setCurrentTab} />
      case 'password':   return <PasswordAnalyser setCurrentTab={setCurrentTab} />
      case 'phishing':   return <PhishingDetector setCurrentTab={setCurrentTab} />
      case 'history':    return <ScanHistory setCurrentTab={setCurrentTab} />
      case 'brokers':    return <DataBrokers setCurrentTab={setCurrentTab} />
      default:           return <Dashboard setCurrentTab={setCurrentTab} />
    }
  }

  return (
    <div className="flex flex-row min-h-screen bg-black w-full overflow-hidden">
      {/* ── SIDEBAR ─────────────────────────────────── */}
      <aside className="bg-black text-white font-mono text-[10px] tracking-tight border-r border-[#222222] w-64 flex flex-col min-h-screen py-8 hidden md:flex shrink-0">
        {/* Operator badge */}
        <div className="px-6 mb-10">
          <div className="text-[10px] text-[#919191] mb-1 uppercase tracking-tighter">OPERATOR_01</div>
          <div className="text-[8px] text-white tracking-widest opacity-50 uppercase">CLEARANCE: OMEGA</div>
        </div>

        {/* Navigation */}
        <nav className="flex-1">
          <div className="space-y-0">
            {navItems.map(item => (
              <a
                key={item.id}
                href="#"
                onClick={(e) => { e.preventDefault(); setCurrentTab(item.id) }}
                className={`flex items-center px-6 py-3 transition-all duration-100 ${
                  currentTab === item.id
                    ? 'bg-white text-black font-bold'
                    : 'text-[#919191] hover:text-white hover:bg-[#131313]'
                }`}
              >
                <span className="material-symbols-outlined mr-3 text-sm">{item.icon}</span>
                {item.label}
              </a>
            ))}
          </div>
        </nav>

        {/* Initiate Scan CTA */}
        <div className="px-4 mt-auto pt-8">
          <button
            onClick={() => setCurrentTab('scan')}
            className="w-full bg-white text-black py-4 font-bold text-[10px] tracking-[0.2em] hover:bg-[#d4d4d4] transition-colors"
          >
            INITIATE_SCAN
          </button>
        </div>
      </aside>

      {/* ── MAIN COLUMN ─────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen w-full overflow-hidden">

        {/* Top Header */}
        <header className="bg-black text-white uppercase tracking-widest text-sm border-b border-[#222222] flex justify-between items-center w-full px-6 h-16 shrink-0">
          <div className="text-xl font-bold tracking-tighter text-white uppercase font-mono">
            FORENSIC_ARCHIVE<span className="text-[#919191]">_v1.0</span>
          </div>
          <div className="hidden lg:flex items-center space-x-8 font-mono text-xs">
            <a onClick={() => setCurrentTab('scanner')} className="text-[#919191] hover:text-white cursor-pointer transition-colors duration-100 px-2 py-1">INTEL</a>
            <a onClick={() => setCurrentTab('scanner')} className="text-[#919191] hover:text-white cursor-pointer transition-colors duration-100 px-2 py-1">BREACH_LOGS</a>
            <a onClick={() => setCurrentTab('phishing')} className="text-[#919191] hover:text-white cursor-pointer transition-colors duration-100 px-2 py-1">SENSORS</a>
            <a onClick={() => setCurrentTab('dashboard')} className={`cursor-pointer transition-colors duration-100 px-2 py-1 ${currentTab === 'dashboard' ? 'text-white border-b border-white pb-1' : 'text-[#919191] hover:text-white'}`}>OVERVIEW</a>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative hidden sm:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#919191] text-xs">search</span>
              <input
                className="bg-transparent border-b border-[#222222] pl-10 pr-4 py-1 text-xs focus:outline-none focus:border-white transition-all w-48 font-mono"
                placeholder="QUERY_ID..."
                type="text"
              />
            </div>
            <div className="flex space-x-1">
              <button className="material-symbols-outlined p-2 text-[#919191] hover:bg-white hover:text-black transition-colors duration-100">terminal</button>
              <button className="material-symbols-outlined p-2 text-[#919191] hover:bg-white hover:text-black transition-colors duration-100">settings</button>
              <button className="material-symbols-outlined p-2 text-[#919191] hover:bg-white hover:text-black transition-colors duration-100">logout</button>
            </div>
          </div>
        </header>

        {/* Active Page */}
        <div className="flex-1 overflow-auto bg-black">
          {renderActiveTab()}
        </div>

        {/* Footer */}
        <footer className="h-12 border-t border-[#222222] bg-black px-6 flex items-center justify-between font-mono text-[9px] text-[#919191] shrink-0">
          <div className="flex items-center space-x-6">
            <span>© 2024 DIGITAL_FOOTPRINT_GUARDIAN</span>
            <span className="flex items-center">
              <span className="w-1.5 h-1.5 bg-white rounded-full mr-2 animate-pulse"></span>
              SYSTEM_LIVE
            </span>
          </div>
          <div className="tracking-[0.2em] uppercase">
            LATENCY: 12MS // REGION: AP-SOUTH-01
          </div>
        </footer>
      </div>
    </div>
  )
}

export default App
