// Design tokens específicos para el flujo de registro extraídos del Scribe ComboHR
export const registrationTokens = {
  colors: {
    // Colores principales del brand ComboHR
    primary: 'hsl(204, 94%, 94%)', // Azul claro del botón "Start your free Trial"
    primaryDark: 'hsl(204, 94%, 85%)', // Hover del botón principal
    
    // Colores de interfaz
    background: 'hsl(0, 0%, 100%)', // Fondo blanco limpio
    cardBackground: 'hsl(0, 0%, 98%)', // Fondo de cards ligeramente gris
    border: 'hsl(220, 9%, 89%)', // Bordes delgados y suaves
    borderFocus: 'hsl(204, 100%, 70%)', // Bordes en focus
    
    // Estados
    success: 'hsl(142, 76%, 36%)', // Verde para éxito
    error: 'hsl(0, 84%, 60%)', // Rojo para errores
    warning: 'hsl(38, 92%, 50%)', // Amarillo para advertencias
    
    // Texto
    textPrimary: 'hsl(220, 9%, 46%)', // Texto principal
    textSecondary: 'hsl(220, 9%, 65%)', // Texto secundario
    textMuted: 'hsl(220, 9%, 80%)', // Texto deshabilitado
    
    // Progress bar
    progressBg: 'hsl(220, 9%, 95%)',
    progressFill: 'hsl(204, 94%, 70%)',
    
    // Botones secundarios
    buttonSecondary: 'hsl(0, 0%, 96%)',
    buttonSecondaryHover: 'hsl(0, 0%, 92%)',
  },
  
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem',
    
    // Específicos del formulario
    formGap: '1.25rem',
    sectionGap: '2rem',
    stepGap: '2.5rem',
  },
  
  borderRadius: {
    // Todos los elementos son redondeados como indica el Scribe
    sm: '0.375rem', // 6px
    md: '0.5rem',   // 8px
    lg: '0.75rem',  // 12px
    full: '9999px', // Completamente redondeado
  },
  
  shadows: {
    // Sombras sutiles y modernas
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    card: '0 2px 8px rgba(0, 0, 0, 0.08)',
  },
  
  typography: {
    // Tamaños de fuente del sistema
    title: {
      fontSize: '1.75rem', // 28px
      fontWeight: '700',
      lineHeight: '1.2',
    },
    subtitle: {
      fontSize: '1rem', // 16px
      fontWeight: '400',
      lineHeight: '1.5',
    },
    button: {
      fontSize: '0.875rem', // 14px
      fontWeight: '500',
    },
    label: {
      fontSize: '0.875rem', // 14px
      fontWeight: '500',
    },
    input: {
      fontSize: '0.875rem', // 14px
      fontWeight: '400',
    },
  },
  
  transitions: {
    // Transiciones suaves
    default: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    slow: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;