/** @type {import('tailwindcss').Config} */
export default {
  content: ["./client/index.html", "./client/**/*.{jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        'voice-idle': 'var(--color-voice-idle)',
        'voice-listening': 'var(--color-voice-listening)',
        'voice-speaking': 'var(--color-voice-speaking)',
        'voice-processing': 'var(--color-voice-processing)',
        'voice-error': 'var(--color-voice-error)',
        'surface-light': 'var(--color-surface-light)',
        'surface-lighter': 'var(--color-surface-lighter)',
        'text-dim': 'var(--color-text-dim)',
      },
      backgroundImage: {
        'gradient-voice-idle': 'var(--gradient-voice-idle)',
        'gradient-voice-listening': 'var(--gradient-voice-listening)',
        'gradient-voice-speaking': 'var(--gradient-voice-speaking)',
        'gradient-voice-processing': 'var(--gradient-voice-processing)',
      },
      boxShadow: {
        'glow': 'var(--glow-primary)',
        'glow-secondary': 'var(--glow-secondary)',
        'glow-accent': 'var(--glow-accent)',
        'glow-voice-idle': 'var(--glow-voice-idle)',
        'glow-voice-listening': 'var(--glow-voice-listening)',
        'glow-voice-speaking': 'var(--glow-voice-speaking)',
        'glow-voice-processing': 'var(--glow-voice-processing)',
      },
      backdropBlur: {
        'glass': 'var(--glass-blur)',
        'glass-heavy': 'var(--glass-blur-heavy)',
      },
      animation: {
        'voice-idle-pulse': 'voice-idle-pulse 1.2s ease-in-out infinite',
        'voice-listening-ripple': 'voice-listening-ripple 1s ease-out infinite',
        'voice-speaking-wave': 'voice-speaking-wave 0.8s ease-in-out infinite',
        'voice-processing-spin': 'voice-processing-spin 0.6s linear infinite',
        'breathe': 'breathe 1.2s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 1.2s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in-up': 'fade-in-up 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in-down': 'fade-in-down 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in-left': 'fade-in-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-in-right': 'fade-in-right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-in': 'scale-in 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in-left': 'slide-in-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'slide-in-right': 'slide-in-right 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        'shimmer': 'shimmer 2s infinite',
        'particle-float': 'particle-float 3s ease-in-out infinite',
        'button-press': 'button-press 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        'elastic-bounce': 'elastic-bounce 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      transitionDuration: {
        'fast': 'var(--animation-duration-fast)',
        'normal': 'var(--animation-duration-normal)',
        'slow': 'var(--animation-duration-slow)',
        'extra-slow': 'var(--animation-duration-extra-slow)',
      },
      transitionTimingFunction: {
        'smooth': 'var(--animation-easing-smooth)',
        'bounce': 'var(--animation-easing-bounce)',
        'elastic': 'var(--animation-easing-elastic)',
      },
      spacing: {
        'xs': 'var(--spacing-xs)',
        'sm': 'var(--spacing-sm)',
        'md': 'var(--spacing-md)',
        'lg': 'var(--spacing-lg)',
        'xl': 'var(--spacing-xl)',
        '2xl': 'var(--spacing-2xl)',
      },
      borderRadius: {
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'xl': 'var(--radius-xl)',
      },
      zIndex: {
        'base': 'var(--z-base)',
        'overlay': 'var(--z-overlay)',
        'modal': 'var(--z-modal)',
        'popover': 'var(--z-popover)',
        'tooltip': 'var(--z-tooltip)',
        'notification': 'var(--z-notification)',
      },
    },
  },
  plugins: [],
};
