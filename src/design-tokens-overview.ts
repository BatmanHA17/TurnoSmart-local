export const overviewDesignTokens = {
  colors: {
    primary: 'hsl(var(--primary))',
    secondary: 'hsl(var(--secondary))',
    muted: 'hsl(var(--muted))',
    mutedForeground: 'hsl(var(--muted-foreground))',
    background: 'hsl(var(--background))',
    foreground: 'hsl(var(--foreground))',
    card: 'hsl(var(--card))',
    cardForeground: 'hsl(var(--card-foreground))',
    border: 'hsl(var(--border))',
    ring: 'hsl(var(--ring))',
    
    // Colores específicos para cards de estadísticas
    success: 'hsl(142, 76%, 36%)',
    warning: 'hsl(38, 92%, 50%)',
    info: 'hsl(217, 91%, 60%)',
    neutral: 'hsl(215, 16%, 47%)',
    
    // Gradientes para visualización
    gradientPrimary: 'linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-foreground)))',
    gradientSuccess: 'linear-gradient(135deg, hsl(142, 76%, 36%), hsl(142, 76%, 46%))',
    gradientWarning: 'linear-gradient(135deg, hsl(38, 92%, 50%), hsl(38, 92%, 60%))',
    gradientInfo: 'linear-gradient(135deg, hsl(217, 91%, 60%), hsl(217, 91%, 70%))',
  },
  
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
    '2xl': '3rem',    // 48px
    '3xl': '4rem',    // 64px
  },
  
  radius: {
    sm: '0.375rem',   // 6px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
  },
  
  shadows: {
    subtle: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    modal: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  
  typography: {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: {
      xs: '0.75rem',    // 12px
      sm: '0.875rem',   // 14px
      base: '1rem',     // 16px
      lg: '1.125rem',   // 18px
      xl: '1.25rem',    // 20px
      '2xl': '1.5rem',  // 24px
      '3xl': '1.875rem', // 30px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  
  animation: {
    fadeIn: 'fade-in 0.3s ease-out',
    slideIn: 'slide-in 0.2s ease-out',
    scaleIn: 'scale-in 0.15s ease-out',
  },
};