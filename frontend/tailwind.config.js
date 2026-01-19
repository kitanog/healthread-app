/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Healthread brand colors
        primary: {
          50: '#f0f7f4',
          100: '#d9ebe3',
          200: '#b5d7c9',
          300: '#88bda8',
          400: '#5c9d84',
          500: '#2D5A4A', // Main primary
          600: '#2a5244',
          700: '#254839',
          800: '#1f3a2f',
          900: '#1a2f26', // Sidebar
        },
        accent: {
          50: '#fef9f0',
          100: '#fef3e2',
          200: '#fce5be',
          300: '#f5d9a8',
          400: '#E8B86D', // Main accent
          500: '#d4a055',
          600: '#b8863f',
          700: '#996c33',
          800: '#7a552a',
          900: '#634523',
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
        'soft': '0 4px 24px rgba(45, 90, 74, 0.08)',
        'medium': '0 8px 40px rgba(45, 90, 74, 0.12)',
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
