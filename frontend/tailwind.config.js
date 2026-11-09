/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#060B17',
          900: '#0B1224',
          850: '#0F182E',
          800: '#141E38',
          750: '#1A284A',
          700: '#1E293B',
          600: '#334155',
          500: '#64748B',
          400: '#94A3B8',
          300: '#CBD5E1',
          200: '#E2E8F0',
          100: '#F1F5F9',
          50: '#F8FAFC',
        },
        brand: {
          blue: '#3B82F6',
          sky: '#0EA5E9',
          indigo: '#6366F1',
          teal: '#14B8A6',
          emerald: '#10B981',
          amber: '#F59E0B',
          rose: '#F43F5E',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'glow-blue': '0 0 25px -5px rgba(59, 130, 246, 0.3)',
        'glow-cyan': '0 0 25px -5px rgba(14, 165, 233, 0.3)',
        'card': '0 4px 20px -2px rgba(0, 0, 0, 0.35)',
        'card-hover': '0 10px 30px -5px rgba(0, 0, 0, 0.5), 0 0 15px -3px rgba(59, 130, 246, 0.2)',
      }
    },
  },
  plugins: [],
}

