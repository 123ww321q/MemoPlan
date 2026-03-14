/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // 粉色主题
        primary: {
          DEFAULT: '#ec4899', // 粉色
          50: '#fdf2f8',
          100: '#fce7f3',
          200: '#fbcfe8',
          300: '#f9a8d4',
          400: '#f472b6',
          500: '#ec4899',
          600: '#db2777',
          700: '#be185d',
          800: '#9d174d',
          900: '#831843',
        },
        // 灰白调背景
        'background-light': '#fafafa',
        'background-dark': '#1a1a1a',
        // 面板颜色
        panel: {
          light: '#ffffff',
          dark: '#262626',
          border: {
            light: '#e5e5e5',
            dark: '#404040',
          }
        }
      },
      fontFamily: {
        display: ['Public Sans', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        full: '9999px',
      },
    },
  },
  plugins: [],
};
