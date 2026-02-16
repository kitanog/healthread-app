/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // IBS Diet Tracker brand colors - warm terracotta/earth tones
        primary: {
          50: '#faf5f0',
          100: '#f0e4d8',
          200: '#e0c9b2',
          300: '#cca888',
          400: '#b5855e',
          500: '#8B5E3C', // Main primary - warm brown
          600: '#7a5235',
          700: '#6a472e',
          800: '#553926',
          900: '#442e1f', // Sidebar
        },
        accent: {
          50: '#f0faf5',
          100: '#dcf2e6',
          200: '#b8e5cd',
          300: '#8dd4ae',
          400: '#5CB88A', // Main accent - fresh green
          500: '#47a075',
          600: '#388560',
          700: '#2d6c4d',
          800: '#24563e',
          900: '#1c4532',
        },
        success: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#059669',
          600: '#047857',
          700: '#065f46',
          800: '#064e3b',
          900: '#053a2d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#D97706',
          600: '#b45309',
          700: '#92400e',
          800: '#78350f',
          900: '#632c0d',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#DC2626',
          600: '#b91c1c',
          700: '#991b1b',
          800: '#7f1d1d',
          900: '#6b1717',
        },
        ai: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366F1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        }
      },
      fontFamily: {
        display: ['DM Serif Display', 'Georgia', 'serif'],
        body: ['Plus Jakarta Sans', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 24px rgba(139, 94, 60, 0.08)',
        'medium': '0 8px 40px rgba(139, 94, 60, 0.12)',
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
      }
    },
  },
  plugins: [],
}
