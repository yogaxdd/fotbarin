/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: 'oklch(98.5% 0.006 330)',
        background: 'oklch(98.5% 0.006 330)',
        'on-background': 'oklch(17% 0.012 330)',
        'on-surface': 'oklch(17% 0.012 330)',
        'on-surface-variant': 'oklch(38% 0.018 330)',
        primary: 'oklch(44% 0.13 350)',
        'primary-container': 'oklch(93% 0.045 350)',
        'on-primary-container': 'oklch(31% 0.1 350)',
        secondary: 'oklch(43% 0.08 300)',
        'secondary-container': 'oklch(93.5% 0.04 305)',
        'on-secondary-container': 'oklch(31% 0.07 305)',
        tertiary: 'oklch(41% 0.075 205)',
        'tertiary-container': 'oklch(92% 0.04 205)',
        'on-tertiary-container': 'oklch(27% 0.06 205)',
        'surface-container': 'oklch(95.5% 0.008 330)',
        'surface-container-low': 'oklch(97.2% 0.006 330)',
        'surface-container-high': 'oklch(93% 0.01 330)',
        'surface-container-highest': 'oklch(90.5% 0.012 330)',
        'surface-variant': 'oklch(92.5% 0.012 330)',
        outline: 'oklch(59% 0.022 330)',
        'outline-variant': 'oklch(84% 0.014 330)',
        'error-container': 'oklch(94% 0.045 25)',
        'on-error-container': 'oklch(33% 0.11 25)',
        success: 'oklch(43% 0.09 155)',
        'success-container': 'oklch(93% 0.05 155)',
      },
      fontFamily: {
        sans: ['Nunito Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['Nunito Sans', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        sticker: '0 1px 2px rgba(24, 18, 22, 0.06), 0 12px 32px rgba(24, 18, 22, 0.08)',
        panel: '0 1px 2px rgba(24, 18, 22, 0.05), 0 20px 60px rgba(24, 18, 22, 0.08)',
      },
    },
  },
  plugins: [],
}
