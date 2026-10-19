/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/modules/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: '#0f172a',
        primary: '#164e63',
        accent: '#14b8a6',
        mutedBg: '#f3f4f6',
      },
      boxShadow: {
        card: '0 8px 30px rgba(15, 23, 42, 0.08)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
