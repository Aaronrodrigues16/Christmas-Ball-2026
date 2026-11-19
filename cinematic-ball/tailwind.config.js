/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'],
        sans: ['Montserrat', 'sans-serif'],
      },
      colors: {
        burgundy: '#430B04',
        gold: '#D7C6A5',
        champagne: '#F5CE62',
      },
    },
  },
  plugins: [],
}
