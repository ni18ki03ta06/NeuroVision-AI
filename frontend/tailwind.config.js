/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // Enable class-based dark mode toggle support
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Deep space academic and clinical slate colors
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1f2937',
          850: '#151b23', // Intermediate dark panel
          900: '#0d1117', // Main background slate
          950: '#07090e', // Darkest deep background
        },
        // Professional, clinical purple-blue primary palette
        primary: {
          50: '#f5f7ff',
          100: '#ebf0ff',
          200: '#d6e0ff',
          300: '#b3c7ff',
          400: '#8fa5ff',
          500: '#6366f1', // Indigo/Blue-purple
          600: '#4f46e5',
          700: '#3f37c9',
          800: '#312a9f',
          900: '#251e77',
          950: '#14104c',
          DEFAULT: '#4f46e5',
          light: '#8fa5ff',
          dark: '#3f37c9',
          glow: 'rgba(79, 70, 229, 0.15)',
        },
        // Calming clinical success green (emerald-teal)
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          DEFAULT: '#16a34a',
          light: '#4ade80',
          dark: '#15803d',
          glow: 'rgba(22, 197, 94, 0.15)',
        },
        // Warm diagnostic warning orange/amber
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          DEFAULT: '#d97706',
          light: '#fbbf24',
          dark: '#b45309',
          glow: 'rgba(245, 158, 11, 0.15)',
        },
        // High-contrast diagnostic danger/alert red
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          DEFAULT: '#dc2626',
          light: '#f87171',
          dark: '#b91c1c',
          glow: 'rgba(239, 68, 68, 0.15)',
        },
      },
      fontFamily: {
        display: ['Outfit', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '76': '19rem',
        '80': '20rem',
        '84': '21rem',
        '96': '24rem',
        '104': '26rem',
        '112': '28rem',
        '120': '30rem',
        '128': '32rem',
        '144': '36rem',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glow-primary': '0 0 15px rgba(79, 70, 229, 0.25)',
        'glow-success': '0 0 15px rgba(22, 163, 74, 0.25)',
        'glow-error': '0 0 15px rgba(239, 68, 68, 0.25)',
      },
    },
  },
  plugins: [],
}
