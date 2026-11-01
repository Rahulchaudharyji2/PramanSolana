/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/react/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        praman: {
          bg: '#080A0F',
          surface: '#0F121C',
          surfaceHover: '#151A28',
          surfaceCard: '#121624',
          border: '#1E2538',
          borderLight: '#2A344D',
          blue: '#397BFF',
          blueHover: '#2A6BF2',
          violet: '#8B5CF6',
          green: '#10B981',
          textMain: '#F8FAFC',
          textMuted: '#94A3B8',
          textSubtle: '#64748B',
        },
      },
    },
  },
  plugins: [],
};

