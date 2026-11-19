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
        primary: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          500: '#14b8a6',
          700: '#0f766e',
          900: '#134e4a',
          DEFAULT: 'var(--color-primary, #0f766e)',
        },
        accent: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          DEFAULT: 'var(--color-accent, #f59e0b)',
        },
        surface: 'var(--color-surface, #ffffff)',
        background: 'var(--color-background, #f8fafc)',
        text: 'var(--color-text, #0f172a)',
        textMuted: 'var(--color-text-muted, #475569)',
        border: 'var(--color-border, #cbd5e1)',
      },
      fontFamily: {
        sans: ['Atkinson Hyperlegible', 'sans-serif'],
        dyslexic: ['OpenDyslexic', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ripple': 'ripple 1.5s cubic-bezier(0, 0.2, 0.8, 1) infinite',
      },
      keyframes: {
        ripple: {
          '0%': { transform: 'scale(0.95)', opacity: '0.8' },
          '100%': { transform: 'scale(1.4)', opacity: '0' },
        }
      }
    },
  },
  plugins: [],
}
