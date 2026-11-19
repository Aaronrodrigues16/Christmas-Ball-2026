/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Outfit', 'Montserrat', 'sans-serif'],
        sans: ['Outfit', 'Montserrat', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'serif'],
      },
      colors: {
        midnight: {
          bg: '#050505',
          bg2: '#0B0B0B',
          gold: '#C6AD78',
          goldMuted: '#8E8062',
          ivory: '#F2EBDD',
          muted: '#AAA69C',
        },
      },
      letterSpacing: {
        nav: '0.32em',
        wide2: '0.18em',
      },
    },
  },
  plugins: [],
}
