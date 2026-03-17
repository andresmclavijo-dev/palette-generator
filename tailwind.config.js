/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand-violet': '#6C47FF',
        'brand-violet-hover': '#5431df',
        'brand-violet-light': '#9b82ff',
        'brand-blue': '#1A73E8',
        'brand-dark': '#1a1a2e',
        'brand-warm': '#FAFAF8',
        'surface-secondary': '#f5f5f3',
        'success': '#3B6D11',
        'warning': '#854F0B',
        'error': '#791F1F',
        'text-faint': '#bbbbbb',
        'border-default': '#e8e8e8',
        'pro-badge-bg': '#EEEDFE',
        'pro-badge-text': '#3C3489',
      },
      fontSize: {
        'xxs': ['8px', { lineHeight: '1' }],
        'badge': ['9px', { lineHeight: '1' }],
        'micro': ['10px', { lineHeight: '1.4' }],
        'caption': ['11px', { lineHeight: '1.4' }],
        'body-sm': ['12px', { lineHeight: '1.5' }],
        'body': ['13px', { lineHeight: '1.5' }],
        'body-lg': ['14px', { lineHeight: '1.5' }],
        'subtitle': ['15px', { lineHeight: '1.4' }],
        'title': ['16px', { lineHeight: '1.3' }],
        'heading': ['18px', { lineHeight: '1.3' }],
        'display-sm': ['20px', { lineHeight: '1.2' }],
        'display': ['22px', { lineHeight: '1.2' }],
        'display-lg': ['24px', { lineHeight: '1.2' }],
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
      },
      zIndex: {
        'swatch-hover': '10',
        'toolbar': '20',
        'sheet': '30',
        'vision-overlay': '40',
        'modal': '50',
        'toast': '60',
      },
      spacing: {
        'button-padding-x': '16px',
        'icon-text-gap': '12px',
        'tab-gap': '4px',
        'nav-gap': '16px',
      },
      height: {
        'header-row': '60px',
        'bottom-bar': '64px',
        'footer-bar': '36px',
        'button': '40px',
        'summary-row': '32px',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateX(-50%) translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(-50%) translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease',
      },
      boxShadow: {
        'swatch-pill': '0 2px 8px rgba(0,0,0,0.12)',
        'sheet': '0 -4px 24px rgba(0,0,0,0.08)',
        'modal': '0 8px 40px rgba(0,0,0,0.16)',
      },
    },
  },
  plugins: [],
}
