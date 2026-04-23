import fs from 'fs/promises';
import path from 'path';

const files = [
  {
    name: 'BreachScanner.jsx',
    url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzc0NzAzMjZmOWQwNzQ3MTZiN2M4MmYyMmRhNGUyODAyEgsSBxDU2OqQzhUYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTA2MDU0NTM3Mzg4MDMyNzI3Nw&filename=&opi=96797242'
  },
  {
    name: 'PasswordAnalyser.jsx',
    url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzU1ZGEzMzU2ZDMyMzRhMmQ4NGZlZjYwMDYxMTQxZTVkEgsSBxDU2OqQzhUYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTA2MDU0NTM3Mzg4MDMyNzI3Nw&filename=&opi=96797242'
  },
  {
    name: 'PhishingDetector.jsx',
    url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzc0MTgzZmQwNmY5MTQ5OTE4NWNkM2RmN2NmYjNiMjQ5EgsSBxDU2OqQzhUYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTA2MDU0NTM3Mzg4MDMyNzI3Nw&filename=&opi=96797242'
  },
  {
    name: 'ScanHistory.jsx',
    url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2VmYTY4N2FmZDk3ZDQwYzI5YzIwZWY0ZjlkODM5Mjk2EgsSBxDU2OqQzhUYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTA2MDU0NTM3Mzg4MDMyNzI3Nw&filename=&opi=96797242'
  }
];

// Helper to convert HTML attributes to JSX
function htmlToJSX(html) {
  let jsx = html
    .replace(/class=/g, 'className=')
    .replace(/for=/g, 'htmlFor=')
    // Fix self closing tags
    .replace(/<(img|hr|br|input|meta|link)([^>]*?)>/g, (match, tag, attrs) => {
        if(match.endsWith('/>')) return match;
        return `<${tag}${attrs} />`;
    })
    // Fix inline styles - just standard ones found in generated designs like style="color: red;"
    .replace(/style="([^"]*)"/g, (match, styleString) => {
        const styleObj = styleString.split(';').reduce((acc, pair) => {
            let [key, val] = pair.split(':');
            if (!key || !val) return acc;
            key = key.trim().replace(/-([a-z])/g, g => g[1].toUpperCase());
            acc.push(`${key}: '${val.trim().replace(/'/g, "\\'")}'`);
            return acc;
        }, []).join(', ');
        return `style={{${styleObj}}}`;
    })
    // SVG stroke-width, stroke-linecap etc
    .replace(/([a-z]+)-([a-z]+)=/g, (match, p1, p2) => {
        // Exclude data- and aria- attributes
        if (p1 === 'data' || p1 === 'aria') return match;
        return `${p1}${p2.charAt(0).toUpperCase() + p2.slice(1)}=`;
    });
    
  return jsx;
}

async function run() {
  const compDir = path.join(process.cwd(), 'src', 'components', 'tabs');
  
  for (const f of files) {
    console.log(`Downloading ${f.name}...`);
    try {
      const resp = await fetch(f.url);
      const htmlText = await resp.text();
      
      // Extract just the body content
      const bodyMatch = htmlText.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      const innerHtml = bodyMatch ? bodyMatch[1] : htmlText;
      
      const jsx = htmlToJSX(innerHtml);
      
      const compName = f.name.replace('.jsx', '');
      const reactCode = `import React from 'react';\n\nexport default function ${compName}() {\n  return (\n    <>\n${jsx}\n    </>\n  );\n}\n`;
      
      await fs.writeFile(path.join(compDir, f.name), reactCode);
      console.log(`Successfully wrote ${f.name}`);
    } catch (e) {
      console.error(`Failed on ${f.name}:`, e);
    }
  }
}

run();
