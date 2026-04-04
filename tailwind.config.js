/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        carolina: '#4B9CD3',
        'nc-gold': '#FFC72C',
        'blue-800': '#1E3A5F',
        'teal-500': '#14B8A6',
        'gh-dark': {
          900: '#0F1A2E',
          800: '#162033',
          700: '#1A2840',
          600: '#1E2D44',
          500: '#243650',
        },
        'gh-text': {
          primary: '#FFFFFF',
          body: '#E8ECF0',
          soft: '#C4CDD5',
          muted: '#6B7B8D',
          faint: '#4B5C6E',
        },
      },
      fontFamily: {
        body: ['"DM Sans"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        display: ['"Fraunces"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
