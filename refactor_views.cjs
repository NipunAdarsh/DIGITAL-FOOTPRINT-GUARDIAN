const fs = require('fs/promises');
const path = require('path');

async function extractMains() {
  const dir = path.join(process.cwd(), 'src/components/tabs');
  const files = ['BreachScanner.jsx', 'PasswordAnalyser.jsx', 'PhishingDetector.jsx', 'ScanHistory.jsx'];
  
  let layoutParts = null;

  for (const file of files) {
    const fullPath = path.join(dir, file);
    let content = await fs.readFile(fullPath, 'utf-8');
    
    // For BreachScanner, let's extract the sidebar, header, and footer.
    if (file === 'BreachScanner.jsx' && !layoutParts) {
      const asideMatch = content.match(/(<aside[\s\S]*?<\/aside>)/);
      const headerMatch = content.match(/(<header[\s\S]*?<\/header>)/);
      const footerMatch = content.match(/(<footer[\s\S]*?<\/footer>)/);
      
      if (asideMatch && headerMatch && footerMatch) {
         layoutParts = {
           aside: asideMatch[1],
           header: headerMatch[1],
           footer: footerMatch[1]
         };
      }
    }

    const mainMatch = content.match(/(<main[\s\S]*?<\/main>)/);
    if (mainMatch) {
      // Small fixes for React
      let inner = mainMatch[1];
      inner = inner.replace(/for=/g, 'htmlFor='); // safety duplicate
      
      const newContent = `import React from 'react';\n\nexport default function ${file.replace('.jsx', '')}({ setCurrentTab }) {\n  return (\n    ${inner}\n  );\n}`;
      await fs.writeFile(fullPath, newContent);
      console.log('Extracted main from ' + file);
    }
  }

  // Now rewrite App.jsx with Layout and Navigation
  if (layoutParts) {
     // Modifying the aside navigation to actually switch tabs
     let aside = layoutParts.aside;
     
     // Rewrite sidebar links to trigger tab switches
     aside = aside.replace(/href="#"/g, `href="#" onClick={(e) => { e.preventDefault(); }}`);
     
     // Specific replacements for the 4 tabs based on text inside them
     aside = aside.replace(/>\s*DASHBOARD\s*<\/a>/, ` onClick={(e) => { e.preventDefault(); setCurrentTab('scanner'); }}>DASHBOARD</a>`);
     aside = aside.replace(/>\s*THREAT_MAP\s*<\/a>/, ` onClick={(e) => { e.preventDefault(); setCurrentTab('phishing'); }}>THREAT_MAP</a>`);
     aside = aside.replace(/>\s*ARCHIVE\s*<\/a>/, ` onClick={(e) => { e.preventDefault(); setCurrentTab('history'); }}>ARCHIVE</a>`);
     aside = aside.replace(/>\s*TERMINAL\s*<\/a>/, ` onClick={(e) => { e.preventDefault(); setCurrentTab('password'); }}>TERMINAL</a>`);

     // Make the links dynamic based on currentTab
     // Dashboard (BreachScanner)
     aside = aside.replace(/<a className="bg-white text-black font-bold flex items-center px-6 py-3" onClick=\{\(e\) => \{ e\.preventDefault\(\); setCurrentTab\('history'\); \}\}>/, 
        "{/* ARCHIVE (SCAN HISTORY) */}\n<a className={`flex items-center px-6 py-3 transition-all ${currentTab === 'history' ? 'bg-white text-black font-bold' : 'text-[#919191] hover:text-white hover:bg-[#131313]'}`} href=\"#\" onClick={(e) => { e.preventDefault(); setCurrentTab('history'); }}>");

     aside = aside.replace(/<a className="text-\[#919191\] flex items-center px-6 py-3 hover:text-white transition-all hover:bg-\[#131313\]" onClick=\{\(e\) => \{ e\.preventDefault\(\); setCurrentTab\('scanner'\); \}\}>/, 
        "{/* DASHBOARD (BREACH SCANNER) */}\n<a className={`flex items-center px-6 py-3 transition-all ${currentTab === 'scanner' ? 'bg-white text-black font-bold' : 'text-[#919191] hover:text-white hover:bg-[#131313]'}`} href=\"#\" onClick={(e) => { e.preventDefault(); setCurrentTab('scanner'); }}>");

     aside = aside.replace(/<a className="text-\[#919191\] flex items-center px-6 py-3 hover:text-white transition-all hover:bg-\[#131313\]" onClick=\{\(e\) => \{ e\.preventDefault\(\); setCurrentTab\('phishing'\); \}\}>/, 
        "{/* THREAT MAP (PHISHING) */}\n<a className={`flex items-center px-6 py-3 transition-all ${currentTab === 'phishing' ? 'bg-white text-black font-bold' : 'text-[#919191] hover:text-white hover:bg-[#131313]'}`} href=\"#\" onClick={(e) => { e.preventDefault(); setCurrentTab('phishing'); }}>");

     aside = aside.replace(/<a className="text-\[#919191\] flex items-center px-6 py-3 hover:text-white transition-all hover:bg-\[#131313\]" onClick=\{\(e\) => \{ e\.preventDefault\(\); setCurrentTab\('password'\); \}\}>/, 
        "{/* TERMINAL (PASSWORD ANALYSER) */}\n<a className={`flex items-center px-6 py-3 transition-all ${currentTab === 'password' ? 'bg-white text-black font-bold' : 'text-[#919191] hover:text-white hover:bg-[#131313]'}`} href=\"#\" onClick={(e) => { e.preventDefault(); setCurrentTab('password'); }}>");


     const appCode = `import React, { useState } from 'react'
import BreachScanner from './components/tabs/BreachScanner'
import PasswordAnalyser from './components/tabs/PasswordAnalyser'
import PhishingDetector from './components/tabs/PhishingDetector'
import ScanHistory from './components/tabs/ScanHistory'

// Backend hooks (will be used later in the respective components by passing down or context)
import { getBreaches } from './utils/simulatedBreachApi'
import { analyzeBreaches, analyzePassword, analyzeUrl } from './utils/geminiApi'
import { calculateRiskScore } from './utils/riskScorer'
import { sha256, maskEmail, maskUrl } from './utils/hashUtils'
import { getStrengthScore } from './utils/passwordAnalyser'
import { analyzeUrl as detectPhishing } from './utils/phishingDetector'
import { saveScan, saveBreaches, saveRemediationSteps, savePasswordCheck, saveUrlCheck } from './db/queries'

function App() {
  const [currentTab, setCurrentTab] = useState('scanner'); // 'scanner', 'password', 'phishing', 'history'

  const renderActiveTab = () => {
    switch (currentTab) {
      case 'scanner':
        return <BreachScanner setCurrentTab={setCurrentTab} />;
      case 'password':
        return <PasswordAnalyser setCurrentTab={setCurrentTab} />;
      case 'phishing':
        return <PhishingDetector setCurrentTab={setCurrentTab} />;
      case 'history':
        return <ScanHistory setCurrentTab={setCurrentTab} />;
      default:
        return <BreachScanner setCurrentTab={setCurrentTab} />;
    }
  };

  return (
    <div className="flex flex-row min-h-screen bg-black w-full overflow-hidden">
      ${aside.replace(/\n(?=\s*<)/g, '\n      ')}
      
      <div className="flex-1 flex flex-col min-h-screen relative w-full h-full overflow-hidden">
        ${layoutParts.header.replace(/\n(?=\s*<)/g, '\n        ')}
        
        {renderActiveTab()}
        
        ${layoutParts.footer.replace(/\n(?=\s*<)/g, '\n        ')}
      </div>
    </div>
  )
}

export default App
`;
    
     await fs.writeFile(path.join(process.cwd(), 'src/App.jsx'), appCode);
     console.log('Successfully wrote App.jsx');
  }
}

extractMains();
