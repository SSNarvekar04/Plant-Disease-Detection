/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Nature-inspired green palette, shared by buttons, badges and charts.
        leaf: {
          50: '#f2fdf4',
          100: '#dcfce4',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        soil: {
          50: '#faf8f5',
          100: '#f0ece4',
          400: '#a89684',
          600: '#6f5f4c',
          800: '#3f362b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(16, 40, 24, 0.08), 0 8px 24px -12px rgba(16, 40, 24, 0.18)',
        'card-hover': '0 4px 8px rgba(16, 40, 24, 0.1), 0 18px 36px -14px rgba(16, 40, 24, 0.26)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.4s ease-out both',
        'fade-in': 'fade-in 0.3s ease-out both',
        'scale-in': 'scale-in 0.2s ease-out both',
      },
    },
  },
  plugins: [],
};