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
        // Dynamic theme mappings using CSS variables
        bg: 'rgb(var(--color-background) / <alpha-value>)',
        lightBg: 'rgb(var(--color-background) / <alpha-value>)',
        'bg-dark': 'rgb(var(--color-background) / <alpha-value>)',
        card: 'rgb(var(--color-card) / <alpha-value>)',
        'card-dark': 'rgb(var(--color-card) / <alpha-value>)',
        border: 'rgb(var(--color-border) / <alpha-value>)',
        'border-border': 'rgb(var(--color-border) / <alpha-value>)',
        lightBorder: 'rgb(var(--color-border) / <alpha-value>)',
        'border-dark': 'rgb(var(--color-border) / <alpha-value>)',

        // Brand colors (Unified Emerald Educational theme)
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        'primary-dark': 'rgb(var(--color-primary) / <alpha-value>)',
        'primary-hover': 'rgb(var(--color-primary-hover) / <alpha-value>)',
        
        accent: 'rgb(var(--color-primary) / <alpha-value>)',
        'accent-dark': 'rgb(var(--color-primary) / <alpha-value>)',
        'accent-hover': 'rgb(var(--color-primary-hover) / <alpha-value>)',

        // Legacy / AI aliases maps to emerald branding
        aiPrimary: 'rgb(var(--color-primary) / <alpha-value>)',
        'aiPrimary-dark': 'rgb(var(--color-primary) / <alpha-value>)',
        aiAccent: 'rgb(var(--color-primary) / <alpha-value>)',
        'aiAccent-dark': 'rgb(var(--color-primary) / <alpha-value>)',
        aiSecondary: 'rgb(var(--color-body) / <alpha-value>)',
        'aiSecondary-dark': 'rgb(var(--color-body) / <alpha-value>)',

        // Text color mappings
        textPrimary: 'rgb(var(--color-heading) / <alpha-value>)',
        'textPrimary-dark': 'rgb(var(--color-heading) / <alpha-value>)',
        textSecondary: 'rgb(var(--color-body) / <alpha-value>)',
        'textSecondary-dark': 'rgb(var(--color-body) / <alpha-value>)',
        'text-primary': 'rgb(var(--color-heading) / <alpha-value>)',
        'text-primary-dark': 'rgb(var(--color-heading) / <alpha-value>)',
        'text-secondary': 'rgb(var(--color-body) / <alpha-value>)',
        'text-secondary-dark': 'rgb(var(--color-body) / <alpha-value>)',

        success: 'rgb(var(--color-success) / <alpha-value>)',
        'success-dark': 'rgb(var(--color-success) / <alpha-value>)',
        error: '#EF4444',
        'error-dark': '#F87171',
        warning: '#F59E0B',
        'warning-dark': '#FBBF24',

        // Map standard Tailwind colors to emerald colors to migrate legacy components gracefully
        indigo: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: 'rgb(var(--color-primary) / <alpha-value>)',
          600: 'rgb(var(--color-primary-hover) / <alpha-value>)',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
          950: '#022C22',
        },
        purple: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: 'rgb(var(--color-primary) / <alpha-value>)',
          600: 'rgb(var(--color-primary-hover) / <alpha-value>)',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        cyan: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: 'rgb(var(--color-primary) / <alpha-value>)',
          600: 'rgb(var(--color-primary-hover) / <alpha-value>)',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        violet: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: 'rgb(var(--color-primary) / <alpha-value>)',
          600: 'rgb(var(--color-primary-hover) / <alpha-value>)',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-light': '0 10px 28px rgba(15, 23, 42, 0.07)',
        'ai-glow': '0 0 14px rgba(16, 185, 129, 0.22)',
        'ai-glow-soft': '0 0 8px rgba(16, 185, 129, 0.14)',
        'ai-card': '0 10px 28px rgba(15, 23, 42, 0.07)',
        'neon-indigo': '0 0 15px rgba(16, 185, 129, 0.35)',
        'neon-cyan': '0 0 15px rgba(16, 185, 129, 0.35)',
      },
      backgroundImage: {
        'ai-cta': 'linear-gradient(135deg, rgb(var(--color-primary)) 0%, rgb(var(--color-primary-hover)) 100%)',
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
