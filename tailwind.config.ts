import type { Config } from 'tailwindcss'

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Primary Brand Colors - Shamrock Green for health and growth
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#5db382', // Lighter interactions
          500: '#4c9f70', // Main shamrock green
          600: '#3d8059', // Hover states, depth
          700: '#2f6244',
          800: '#1f4c30',
          900: '#14371f',
          950: '#052e16',
        },
        // Secondary - Vista Blue for calm and trust
        secondary: {
          50: '#f0f4ff',
          100: '#e0ecff',
          200: '#c7dcff',
          300: '#a4b8dc', // Lighter elements
          400: '#8ea4d2', // Main vista blue
          500: '#7490c8', // Hover states
          600: '#5a7cb8',
          700: '#4968a3',
          800: '#3a548e',
          900: '#2f4374',
          950: '#1e2a4a',
        },
        // Accent - Glaucous Blue for professional depth
        accent: {
          50: '#f1f5ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#7a8dc7', // Lighter accents
          500: '#6279b8', // Main glaucous blue
          600: '#5469a4', // Active states
          700: '#475890',
          800: '#3c4a7c',
          900: '#333d68',
          950: '#212845',
        },
        // Foundation - Hookers Green for deep backgrounds
        foundation: {
          50: '#f0f9f4',
          100: '#dcf2e3',
          200: '#bce4c9',
          300: '#8ccda4',
          400: '#5a8271', // Lighter foundation elements
          500: '#496f5d', // Main hookers green
          600: '#3b5a4a', // Darker foundation states
          700: '#2f483a',
          800: '#253a2d',
          900: '#1f3025',
          950: '#0f1914',
        },
        // Depth - Yinmn Blue for professional elements
        depth: {
          50: '#f4f6fa',
          100: '#e8ebf4',
          200: '#d6dcea',
          300: '#bcc4db',
          400: '#5d6585', // Lighter depth elements
          500: '#49516f', // Main yinmn blue
          600: '#3d4459', // Darker text, borders
          700: '#343949',
          800: '#2d313c',
          900: '#2a2d36',
          950: '#1c1e24',
        },
        // Success - Inherited from primary green
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#5db382',
          500: '#4c9f70', // Same as primary
          600: '#3d8059',
          700: '#2f6244',
          800: '#1f4c30',
          900: '#14371f',
          950: '#052e16',
        },
        // Warning - Warm amber
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
          950: '#451a03',
        },
        // Error - Warm red
        error: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        // Neutrals - Modern grays with slight blue tint
        neutral: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
      },
      backgroundImage: {
        // Gradient combinations for natural, wellness-focused brand
        'gradient-primary': 'linear-gradient(135deg, #4c9f70 0%, #496f5d 100%)',
        'gradient-secondary': 'linear-gradient(135deg, #8ea4d2 0%, #6279b8 100%)',
        'gradient-accent': 'linear-gradient(135deg, #6279b8 0%, #49516f 100%)',
        'gradient-success': 'linear-gradient(135deg, #4c9f70 0%, #8ea4d2 100%)',
        'gradient-foundation': 'linear-gradient(135deg, #496f5d 0%, #49516f 100%)',
        'gradient-hero': 'linear-gradient(135deg, #8ea4d2 0%, #6279b8 25%, #49516f 50%, #496f5d 75%, #4c9f70 100%)',
        'gradient-mesh': 'radial-gradient(circle at 20% 80%, #4c9f70 0%, transparent 50%), radial-gradient(circle at 80% 20%, #8ea4d2 0%, transparent 50%), radial-gradient(circle at 40% 40%, #6279b8 0%, transparent 50%)',
        'gradient-card': 'linear-gradient(145deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        'gradient-glow': 'radial-gradient(ellipse at center, rgba(76,159,112,0.15) 0%, transparent 70%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.5s ease-out',
        'slide-left': 'slideLeft 0.5s ease-out',
        'slide-right': 'slideRight 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite alternate',
        'gradient-shift': 'gradientShift 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        pulseGlow: {
          '0%': { boxShadow: '0 0 5px rgba(14, 165, 233, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(14, 165, 233, 0.8), 0 0 30px rgba(168, 85, 247, 0.3)' },
        },
        gradientShift: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      fontFamily: {
        'sans': ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        'mono': ['var(--font-geist-mono)', 'monospace'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(14, 165, 233, 0.3)',
        'glow-lg': '0 0 40px rgba(14, 165, 233, 0.4)',
        'glow-purple': '0 0 20px rgba(168, 85, 247, 0.3)',
        'glow-orange': '0 0 20px rgba(249, 115, 22, 0.3)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
    },
  },
  plugins: [],
} satisfies Config