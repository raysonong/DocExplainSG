/** @type {import('tailwindcss').Config} */
// Single dark theme — colours are the dark palette ported from the old
// src/theme/theme.ts, mapped to shadcn-style semantic names so
// react-native-reusables components work out of the box.
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      // shadcn default dark (zinc) — neutral near-black + near-white primary.
      colors: {
        background: '#09090B',
        foreground: '#FAFAFA',
        card: '#09090B',
        'card-foreground': '#FAFAFA',
        popover: '#18181B',
        'popover-foreground': '#FAFAFA',
        primary: '#FAFAFA',
        'primary-foreground': '#18181B',
        'primary-strong': '#FAFAFA', // light label on dark surfaces
        secondary: '#27272A',
        'secondary-foreground': '#FAFAFA',
        muted: '#27272A',
        'muted-foreground': '#A1A1AA',
        accent: '#27272A',
        'accent-foreground': '#FAFAFA',
        destructive: '#EF4444',
        'destructive-foreground': '#FAFAFA',
        warning: '#F59E0B',
        'warning-foreground': '#1C1917',
        success: '#22C55E',
        'success-foreground': '#052E1B',
        border: '#27272A',
        input: '#27272A',
        ring: '#D4D4D8',
        brand: '#60A5FA', // app wordmark accent (blue)
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '20px',
      },
    },
  },
  plugins: [],
};
