/**
 * Theme mappings for the NeuroVision React SPA
 * Provides design tokens, risk mappings, spacing constants, and shadows matching Tailwind and vanilla styles.
 */
export const theme = {
  // Risk-level styling configurations
  riskLevels: {
    high: {
      color: '#f87171', // Red text (error.light)
      bg: 'rgba(239, 68, 68, 0.05)',
      border: 'rgba(239, 68, 68, 0.5)',
      badgeClass: 'text-error-light bg-red-950/40 border-error-dark/60',
      cardClass: 'border-error-light/50 bg-red-950/5 shadow-red-950/10'
    },
    medium: {
      color: '#fb923c', // Orange text (warning.light)
      bg: 'rgba(249, 115, 22, 0.05)',
      border: 'rgba(249, 115, 22, 0.5)',
      badgeClass: 'text-warning-light bg-amber-950/40 border-warning-dark/60',
      cardClass: 'border-warning-light/50 bg-amber-950/5 shadow-amber-950/10'
    },
    low: {
      color: '#4ade80', // Green text (success.light)
      bg: 'rgba(22, 163, 74, 0.05)',
      border: 'rgba(22, 163, 74, 0.5)',
      badgeClass: 'text-success-light bg-emerald-950/40 border-success-dark/60',
      cardClass: 'border-success-light/50 bg-emerald-950/5 shadow-emerald-950/10'
    },
    none: {
      color: '#4ade80',
      bg: 'rgba(22, 163, 74, 0.05)',
      border: 'rgba(22, 163, 74, 0.5)',
      badgeClass: 'text-success-light bg-emerald-950/40 border-success-dark/60',
      cardClass: 'border-success-light/50 bg-emerald-950/5 shadow-emerald-950/10'
    }
  },

  // Typography scaling utilities (class aggregates)
  typography: {
    title: 'font-display text-4xl sm:text-5xl font-extrabold text-white tracking-tight',
    subtitle: 'text-lg sm:text-xl font-medium text-slate-300 leading-normal',
    h1: 'font-display text-2xl font-bold text-white',
    h2: 'font-display text-lg font-bold text-white',
    h3: 'font-display text-sm font-bold uppercase tracking-wider text-slate-400',
    body: 'text-sm text-slate-300 leading-relaxed',
    bodyMuted: 'text-xs text-slate-500 leading-normal',
    mono: 'font-mono text-xs text-slate-350'
  },

  // Padding & Margin constraints
  spacing: {
    container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10',
    gridGap: 'gap-6 sm:gap-8',
    cardPadding: 'p-5 sm:p-6',
    sidebarWidth: 'w-80'
  },

  // Shadows
  shadows: {
    glass: 'shadow-glass shadow-black/40',
    glowPrimary: 'shadow-glow-primary',
    glowSuccess: 'shadow-glow-success',
    glowError: 'shadow-glow-error'
  }
};

export default theme;
