/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Teko"', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif']
      },
      colors: {
        pitch: { DEFAULT: '#1B4332', 2: '#245C3E', 3: '#0E2A1C' },
        chalk: '#F8F7F3',
        amber: { DEFAULT: '#E8A33D', dark: '#C97F1E' },
        run: '#B3432B',
        line: '#D8D3C6',
        ink: '#0F1B12',
        sub: '#5B6B5F'
      },
      borderRadius: { xl2: '14px' }
    }
  },
  plugins: []
};
