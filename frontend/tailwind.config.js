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
        darkBg: '#0f172a',
        darkCard: 'rgba(30, 41, 59, 0.7)',
        // Light mode redesign palette (Dark mode unchanged via `dark:` classes)
        lightBg: '#F8FBFF',
        lightCard: '#FFFFFF',
        lightBorder: '#DCEAF7',
        // User request: ONLY white + #00FFF7 accent
        aiPrimary: '#00FFF7',
        aiSecondary: '#00FFF7',
        aiAccent: '#00FFF7',
        aiGlow: '#00FFF7',
        textPrimary: '#0F172A',
        textSecondary: '#64748B',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        // Light mode: premium but subtle (less shine)
        'glass-light': '0 10px 28px rgba(15, 23, 42, 0.07)',
        'ai-glow': '0 0 14px rgba(0, 255, 247, 0.22)',
        'ai-glow-soft': '0 0 8px rgba(0, 255, 247, 0.14)',
        'ai-card': '0 10px 28px rgba(15, 23, 42, 0.07)',
        // Legacy names retained for existing dark mode styling
        'neon-indigo': '0 0 15px rgba(99, 102, 241, 0.5)',
        'neon-cyan': '0 0 15px rgba(6, 182, 212, 0.5)',
      },
      backgroundImage: {
        // Keep buttons glossy without introducing extra colors
        'ai-cta': 'linear-gradient(135deg, rgba(0,255,247,0.84) 0%, #00FFF7 55%, rgba(0,255,247,0.72) 100%)',
      },
      animation: {
        'gradient-x': 'gradient-x 15s ease infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        'gradient-x': {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center',
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center',
          },
        },
      },
    },
  },
  plugins: [],
}
