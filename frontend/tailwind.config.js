/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0B0F1A',
        card: '#131A2B',
        card_border: '#1F2942',
        primary: {
          DEFAULT: '#7F5AF0',
          hover: '#9571fa'
        },
        secondary: {
          DEFAULT: '#2CB9FF',
          hover: '#4ecdff'
        },
        warning: '#ffb82c',
        danger: '#ff4b4b'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      animation: {
        'scan': 'scan 2s linear infinite',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: 1, boxShadow: '0 0 15px rgba(127, 90, 240, 0.5)' },
          '50%': { opacity: .7, boxShadow: '0 0 5px rgba(127, 90, 240, 0.2)' },
        }
      }
    },
  },
  plugins: [],
}
