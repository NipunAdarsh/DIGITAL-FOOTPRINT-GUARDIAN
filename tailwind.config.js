export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg:      '#050a0e',
          surface: '#0d1a22',
          border:  '#1a2e3a',
          accent:  '#1e40af', // User's preferred minimalist blue
          danger:  '#ff3c6e',
          safe:    '#7fff6a',
          warn:    '#ffc93c',
          muted:   '#607d8b',
          text:    '#e0eef5',
        }
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        mono:    ['DM Mono', 'monospace'],
      }
    }
  },
  plugins: []
}
