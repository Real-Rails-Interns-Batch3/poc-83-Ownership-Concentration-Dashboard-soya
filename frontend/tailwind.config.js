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
        'rr-bg':       '#030712',
        'rr-surface':  '#0B1117',
        'rr-surface2': '#0f1923',
        'rr-border':   '#1F2937',
        'rr-cyan':     '#38BDF8',
        'rr-indigo':   '#818CF8',
        'rr-warning':  '#FBBF24',
        'rr-danger':   '#F87171',
        'rr-success':  '#34D399',
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'DM Sans', 'sans-serif'],
        mono: ['var(--font-space-mono)', 'Space Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}