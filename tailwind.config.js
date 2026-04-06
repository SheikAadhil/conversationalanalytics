/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        bg: {
          base: '#F4F5F7',
          surface: '#FFFFFF',
          subtle: '#F9FAFB',
        },
        primary: {
          DEFAULT: '#6366F1',
          dark: '#4F46E5',
          soft: '#EEF2FF',
        },
        border: {
          DEFAULT: '#E5E7EB',
          light: '#F3F4F6',
        },
        chart: {
          1: '#6366F1',
          2: '#10B981',
          3: '#F59E0B',
          4: '#EC4899',
          5: '#8B5CF6',
        },
      },
      boxShadow: {
        'soft': '0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.05)',
        'soft-lg': '0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.08)',
        'premium': '0 1px 2px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.05), 0 12px 24px rgba(0,0,0,0.05)',
        'glow': '0 0 15px rgba(99, 102, 241, 0.15)',
        'input-focus': '0 0 0 3px rgba(99,102,241,0.12)',
      },
      borderRadius: {
        'chat': '24px',
        'premium': '18px',
      },
    },
  },
  plugins: [],
}
