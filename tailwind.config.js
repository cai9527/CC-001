/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: '#E8F3FF',
          100: '#B9D7FF',
          200: '#8ABEFF',
          300: '#5BA0FF',
          400: '#2C83FF',
          500: '#165DFF',
          600: '#0E42D2',
          700: '#0A2BA0',
          800: '#061D6E',
          900: '#030F3B',
        },
        warning: {
          50: '#FFF7E8',
          100: '#FFE8B9',
          200: '#FFD88A',
          300: '#FFC75B',
          400: '#FFB22C',
          500: '#FF7D00',
          600: '#D26200',
          700: '#A04900',
          800: '#6E3200',
          900: '#3B1B00',
        },
        success: {
          50: '#E8FFEE',
          100: '#B9FFCE',
          200: '#8AFFAE',
          300: '#5BFF8E',
          400: '#2CFF6E',
          500: '#00B42A',
          600: '#008F20',
          700: '#006A18',
          800: '#004510',
          900: '#002008',
        },
        danger: {
          50: '#FFE8E8',
          100: '#FFB9B9',
          200: '#FF8A8A',
          300: '#FF5B5B',
          400: '#FF2C2C',
          500: '#F53F3F',
          600: '#CB2634',
          700: '#A01527',
          800: '#6E0D1B',
          900: '#3B060E',
        },
        neutral: {
          50: '#F7F8FA',
          100: '#F2F3F5',
          200: '#E5E6EB',
          300: '#C9CDD4',
          400: '#86909C',
          500: '#4E5969',
          600: '#272E3B',
          700: '#1D2129',
          800: '#0F1218',
          900: '#000000',
        }
      },
      fontFamily: {
        sans: ['PingFang SC', 'Microsoft YaHei', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'glow-primary': '0 0 20px rgba(22, 93, 255, 0.3)',
        'glow-danger': '0 0 20px rgba(245, 63, 63, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'pulse-border': 'pulseBorder 2s infinite',
        'bounce-light': 'bounceLight 1s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseBorder: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(245, 63, 63, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(245, 63, 63, 0)' },
        },
        bounceLight: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
    },
  },
  plugins: [],
};
