/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        petlas: {
          navy: '#0f172a',
          red: '#dc2626',
          blue: '#1e3a8a',
          slate: '#334155'
        }
      }
    }
  },
  plugins: []
}
