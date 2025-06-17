/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#00C2B3',
        'white-mist': '#FAFBFC',
        'light-gray': '#F5F6FA',
        'success-green': '#38B000',
        'dark-text': '#1E1E1E',
      },
    },
  },
  plugins: [],
}
