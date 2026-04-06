/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Tema escuro OneVoice — espelha src/design-system/theme.ts
        bg: '#0c0c1d',
        card: '#14142f',
        'card-alt': '#0f0f24',
        surface: '#1e1e45',
        'surface-alt': '#2a2a55',
        border: '#1e1e45',
        'border-alt': '#2a2a55',
        'border-input': '#444',
        input: '#333',

        // Brand
        primary: '#7c3aed',
        'primary-light': '#a78bfa',
        'primary-lighter': '#c4b5fd',
        'primary-lightest': '#ddd6fe',
        'primary-ghost': 'rgba(124,58,237,0.13)',

        // Semânticas
        success: '#4ade80',
        warning: '#f59e0b',
        error: '#ef4444',
        'error-light': '#f87171',

        // Text
        muted: '#888',
        dimmed: '#666',
        subtle: '#555',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
      },
    },
  },
  plugins: [],
}
