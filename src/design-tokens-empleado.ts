// Design tokens extraídos del Scribe de Dashboard Empleado
export const empleadoDesignTokens = {
  colors: {
    primary: {
      main: 'hsl(var(--primary))',
      foreground: 'hsl(var(--primary-foreground))',
      muted: 'hsl(var(--primary) / 0.1)',
    },
    secondary: {
      main: 'hsl(var(--secondary))',
      foreground: 'hsl(var(--secondary-foreground))',
    },
    accent: {
      blue: 'hsl(212, 95%, 68%)',
      blueBg: 'hsl(212, 95%, 95%)',
      orange: 'hsl(25, 95%, 53%)',
      orangeBg: 'hsl(25, 95%, 95%)',
      green: 'hsl(142, 71%, 45%)',
      greenBg: 'hsl(142, 71%, 95%)',
    },
    status: {
      pending: 'hsl(43, 96%, 56%)',
      confirmed: 'hsl(142, 71%, 45%)',
      warning: 'hsl(25, 95%, 53%)',
    }
  },
  spacing: {
    card: '1.5rem',
    section: '2rem',
    grid: '1.5rem',
  },
  typography: {
    heading: {
      h1: 'text-3xl font-bold',
      h2: 'text-xl font-semibold',
      h3: 'text-lg font-semibold',
      h4: 'text-base font-medium',
    },
    body: {
      large: 'text-base',
      medium: 'text-sm',
      small: 'text-xs',
    }
  },
  components: {
    card: {
      base: 'bg-card text-card-foreground border rounded-lg shadow-sm',
      hover: 'hover:shadow-md transition-shadow cursor-pointer',
    },
    badge: {
      primary: 'bg-primary text-primary-foreground',
      secondary: 'bg-secondary text-secondary-foreground',
      outline: 'border border-border bg-background',
      destructive: 'bg-destructive text-destructive-foreground',
    },
    button: {
      primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
      outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
    }
  }
};

export default empleadoDesignTokens;