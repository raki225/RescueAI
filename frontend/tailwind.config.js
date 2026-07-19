/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      screens: {
        xs: '475px',
        '3xl': '1920px',
      },
      colors: {
        primary: '#0A2463',
        secondary: '#1E88E5',
        brand: '#0F3DDE',
        accent: '#FF6B35',
        safe: '#22C55E',
        success: '#16C784',
        caution: '#FFD600',
        danger: '#DC2626',
        surface: '#FFFFFF',
        ink: '#1E293B',
        muted: '#64748B',
        bg: '#F8FAFC',
        severity: {
          critical: '#DC2626',
          urgent: '#FF6B35',
          moderate: '#F5A623',
          mild: '#22C55E',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        glass: '24px',
      },
      boxShadow: {
        glass: '0 8px 32px rgba(0,0,0,0.08)',
        'glass-lg': '0 20px 60px rgba(10,36,99,0.18)',
      },
      backdropBlur: {
        glass: '20px',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(220,38,38,0.5)' },
          '70%': { boxShadow: '0 0 0 16px rgba(220,38,38,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(220,38,38,0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'float-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-14px)' },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(4deg)' },
        },
        blob: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(20px, -30px) scale(1.08)' },
          '66%': { transform: 'translate(-18px, 14px) scale(0.94)' },
        },
        'gradient-x': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'bounce-subtle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'ring-expand': {
          '0%': { transform: 'scale(0.6)', opacity: '0.7' },
          '100%': { transform: 'scale(2.4)', opacity: '0' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 2s infinite',
        'float-up': 'float-up 0.5s ease-out',
        shimmer: 'shimmer 1.6s infinite',
        float: 'float 6s ease-in-out infinite',
        'float-slow': 'float-slow 9s ease-in-out infinite',
        blob: 'blob 14s ease-in-out infinite',
        'gradient-x': 'gradient-x 6s ease infinite',
        'bounce-subtle': 'bounce-subtle 2.4s ease-in-out infinite',
        'ring-expand': 'ring-expand 2s ease-out infinite',
      },
    },
  },
  plugins: [],
};
