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
        // Color palette – modern premium SaaS
        bg: '#F8FAFC',
        lightBg: '#F8FAFC',
        'bg-dark': '#0F172A',
        card: '#FFFFFF',
        'card-dark': 'rgba(30,41,59,0.85)', // slate‑800 with slight opacity for glass effect
        border: '#E5E7EB',
        'border-border': '#E5E7EB',
        lightBorder: '#E5E7EB',
        'border-dark': '#374151',

        // Alias colors for legacy class names used in CSS
        aiPrimary: '#3A7FFF',
        'aiPrimary-dark': '#5393FF',
        aiSecondary: '#6C757D',
        'aiSecondary-dark': '#9CA3AF',
        aiAccent: '#00C9A7',
        'aiAccent-dark': '#14D9B8',
        textPrimary: '#111827',
        'textPrimary-dark': '#F1F5F9',
        textSecondary: '#4B5563',
        'textSecondary-dark': '#CBD5E1',

        primary: '#3A7FFF',
        'primary-dark': '#5393FF',
        secondary: '#6C757D',
        'secondary-dark': '#9CA3AF',
        accent: '#00C9A7',
        'accent-dark': '#14D9B8',

        'text-primary': '#111827',
        'text-primary-dark': '#F1F5F9',
        'text-secondary': '#4B5563',
        'text-secondary-dark': '#CBD5E1',

        success: '#10B981',
        'success-dark': '#34D399',
        error: '#EF4444',
        'error-dark': '#F87171',
        warning: '#F59E0B',
        'warning-dark': '#FBBF24',
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
