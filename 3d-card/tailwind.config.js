/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        burgundy: '#430B04',
        cream: '#F6EBDD',
        gold: '#D7C6A5',
      },
    },
  },
  plugins: [],
}
