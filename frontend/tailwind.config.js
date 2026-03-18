/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'off-white': '#F1F1F1',
        'charcoal': '#2C2C2C',
        'charcoal-dark': '#1F2937',
        // Neutral theme
        'surface': '#FFFFFF',
        'surface-alt': '#F5F5F5',
        'border-light': '#E0E0E0',
        'border-medium': '#D0D0D0',
        'text-primary': '#1A1A1A',
        'text-secondary': '#6B6B6B',
        'accent': '#3B6FA0',
        'accent-hover': '#2E5A85',
        'accent-danger': '#C0392B',
        'accent-danger-hover': '#A93226',
        player: {
          red: '#FF3333',
          orange: '#FF6600',
          yellow: '#FFD700',
          pink: '#FF69B4',
          green: '#00CC66',
          blue: '#3366FF',
        },
      },
      fontFamily: {
        sans: ['Nunito', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
