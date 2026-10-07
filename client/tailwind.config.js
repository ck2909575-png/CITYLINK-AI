/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        command: {
          950: '#070a12',
          900: '#0c1220',
          850: '#11192d',
          800: '#17223b',
          700: '#233355',
          600: '#344b7a',
        },
        emergency: {
          critical: '#ef4444',
          high: '#f97316',
          medium: '#f59e0b',
          low: '#3b82f6',
          resolved: '#10b981',
        },
        led: {
          amber: '#ffaa00',
          glow: '#ff8800',
          bg: '#140c00',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
    },
  },
  plugins: [],
};
