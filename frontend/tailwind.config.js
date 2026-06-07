/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'Mukta', 'system-ui', 'sans-serif'],
        marathi: ['Mukta', 'sans-serif'],
        poppins: ['Inter', 'system-ui', 'sans-serif'], // alias kept for legacy class names
        syne: ['Inter', 'system-ui', 'sans-serif'],    // alias kept for legacy class names
        dmsans: ['Inter', 'system-ui', 'sans-serif'],  // alias kept for legacy class names
      },
      colors: {
        base: {
          bg: '#0a0a0f',
          surface: '#0f0f1a',
          card: '#13131f',
          elevated: '#1a1a2e',
          border: 'rgba(255,255,255,0.07)',
          borderHover: 'rgba(255,255,255,0.12)',
        },
        brand: {
          purple: '#8b5cf6',
          purpleDark: '#6d28d9',
          purpleGlow: 'rgba(139,92,246,0.15)',
          cyan: '#06b6d4',
          cyanGlow: 'rgba(6,182,212,0.1)',
        },
        semantic: {
          success: '#10b981',
          successBg: 'rgba(16,185,129,0.12)',
          successBorder: 'rgba(16,185,129,0.25)',
          warning: '#f59e0b',
          warningBg: 'rgba(245,158,11,0.12)',
          warningBorder: 'rgba(245,158,11,0.25)',
          danger: '#ef4444',
          dangerBg: 'rgba(239,68,68,0.12)',
          dangerBorder: 'rgba(239,68,68,0.25)',
          info: '#3b82f6',
          infoBg: 'rgba(59,130,246,0.12)',
          infoBorder: 'rgba(59,130,246,0.25)',
        },
        member: {
          bg: '#0a0a0f',
          card: '#111118',
          surface: '#17171f',
          elevated: '#1e1e28',
          border: 'rgba(255,255,255,0.07)',
          'border-strong': 'rgba(255,255,255,0.13)',
          'text-primary': '#f0f0f8',
          'text-secondary': '#8888a8',
          'text-muted': '#555568',
          accent: '#6c5ce7',
          emerald: '#00c97a',
          amber: '#f59e0b',
          rose: '#f43f5e',
          sky: '#38bdf8',
          'accent-soft': 'rgba(108,92,231,0.15)',
          'emerald-soft': 'rgba(0,201,122,0.12)',
          'amber-soft': 'rgba(245,158,11,0.12)',
          'rose-soft': 'rgba(244,63,94,0.12)',
          'sky-soft': 'rgba(56,189,248,0.12)',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        wave: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        }
      }
    },
  },
  plugins: [],
}
