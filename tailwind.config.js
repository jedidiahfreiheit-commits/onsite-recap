/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'display': ['"Proxima Nova"', 'Montserrat', 'system-ui', 'sans-serif'],
        'body': ['"Proxima Nova"', 'Montserrat', 'system-ui', 'sans-serif'],
      },
      colors: {
        // ShipHero Brand Colors
        'shiphero': {
          black: '#000000',
          red: '#E85A5A',
          blue: '#3281fd',
        },
        // Dark theme colors
        'midnight': {
          900: '#0a0a0f',
          800: '#111118',
          700: '#1a1a22',
          600: '#252530',
        },
        // Status colors
        'sage': {
          400: '#4ade80',
          500: '#22c55e',
        },
        'coral': {
          400: '#f87171',
          500: '#ef4444',
        },
        'amber': {
          400: '#fbbf24',
          500: '#f59e0b',
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(232, 90, 90, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(232, 90, 90, 0.6)' },
        }
      }
    },
  },
  plugins: [],
}
