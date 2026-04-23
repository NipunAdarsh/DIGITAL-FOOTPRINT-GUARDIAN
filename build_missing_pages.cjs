const fs = require('fs/promises');
const path = require('path');

const pages = [
  {
    name: 'Dashboard',
    file: 'Dashboard.jsx',
    url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzgxZmIzN2NhM2ZhMzQwMTFhYjc0YzQyMjYyZjJiN2I3EgsSBxDU2OqQzhUYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTA2MDU0NTM3Mzg4MDMyNzI3Nw&filename=&opi=96797242'
  },
  {
    name: 'ActiveThreats',
    file: 'ActiveThreats.jsx',
    url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sX2M2ZjhiNjk3NGQxZTRjYWNiMTExMTlkYWYwZDYxZWVhEgsSBxDU2OqQzhUYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTA2MDU0NTM3Mzg4MDMyNzI3Nw&filename=&opi=96797242'
  },
  {
    name: 'SecurityScan',
    file: 'SecurityScan.jsx',
    url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzFlNjRiYWEyY2EzYTQ0Njc5MGU5NWJhMDY1NzNkNDM0EgsSBxDU2OqQzhUYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTA2MDU0NTM3Mzg4MDMyNzI3Nw&filename=&opi=96797242'
  },
  {
    name: 'DataBrokers',
    file: 'DataBrokers.jsx',
    url: 'https://contribution.usercontent.google.com/download?c=CgthaWRhX2NvZGVmeBJ8Eh1hcHBfY29tcGFuaW9uX2dlbmVyYXRlZF9maWxlcxpbCiVodG1sXzI5M2YyOWI1ODA1NzRlNDlhMmE2Yjk2N2JlYzg5MDliEgsSBxDU2OqQzhUYAZIBJAoKcHJvamVjdF9pZBIWQhQxMTA2MDU0NTM3Mzg4MDMyNzI3Nw&filename=&opi=96797242'
  }
];

function htmlToJSX(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')           // strip HTML comments
    .replace(/class=/g, 'className=')           // class → className
    .replace(/for=/g, 'htmlFor=')              // for → htmlFor
    .replace(/(<(?:img|hr|br|input|meta|link)(?:[^>]*?))(?<!\/)>/g, '$1 />') // self-close void tags
    .replace(/style="([^"]*)"/g, (_, styleStr) => {
      const obj = styleStr.split(';').reduce((acc, pair) => {
        const [key, ...vals] = pair.split(':');
        if (!key || !vals.length) return acc;
        const k = key.trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        const v = vals.join(':').trim().replace(/'/g, "\\'");
        return acc + (acc ? ', ' : '') + `${k}: '${v}'`;
      }, '');
      return `style={{${obj}}}`;
    })
    // Fix SVG camelCase attrs only (not data-* or aria-*)
    .replace(/\b(stroke|fill|stop|font|text|clip|marker|paint|shape|vector)(-[a-z]+)=/g, (_, p1, p2) => {
      return p1 + p2.replace(/-([a-z])/g, (_, c) => c.toUpperCase()) + '=';
    });
}

async function run() {
  const tabsDir = path.join(process.cwd(), 'src', 'components', 'tabs');

  for (const page of pages) {
    console.log(`Downloading ${page.name}...`);
    try {
      const resp = await fetch(page.url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const htmlText = await resp.text();

      // Extract <main> block
      const mainMatch = htmlText.match(/<main[\s\S]*?<\/main>/i);
      let body = mainMatch ? mainMatch[0] : htmlText.replace(/<html[\s\S]*?<body[^>]*>/i, '').replace(/<\/body>[\s\S]*/i, '');

      const jsx = htmlToJSX(body);

      const code = `import React from 'react';

export default function ${page.name}({ setCurrentTab }) {
  return (
    ${jsx}
  );
}
`;
      await fs.writeFile(path.join(tabsDir, page.file), code);
      console.log(`✅ Written: ${page.file}`);
    } catch (err) {
      console.error(`❌ Error on ${page.name}:`, err.message);
    }
  }
}

run();
