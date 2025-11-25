/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'eink': {
          'bg-primary': '#FFFFFF',
          'bg-secondary': '#F5F5F5',
          'text-primary': '#000000',
          'text-secondary': '#333333',
          'border': '#000000',
          'accent': '#000000',
          'user-bubble': '#E8E8E8',
          'claude-bubble': '#FFFFFF',
        }
      },
      fontFamily: {
        'serif': ['Literata', 'Georgia', 'serif'],
      },
      fontSize: {
        'base': '18px',
      },
      lineHeight: {
        'relaxed': '1.6',
      },
    },
  },
  plugins: [],
}
