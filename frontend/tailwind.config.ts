import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        compliance: {
          bg: '#f3f4f6',
          surface: '#ffffff',
          text: '#1f2937',
          muted: '#6b7280',
          primary: '#14532d',
          success: '#14532d',
          danger: '#b91c1c',
          info: '#93c5fd',
          submitted: '#c4b5fd',
        },
      },
    },
  },
  plugins: [],
}

export default config
