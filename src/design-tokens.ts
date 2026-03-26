// Design tokens extraídos del tutorial Scribe para la sección Entradas
export const designTokens = {
  colors: {
    // Colores extraídos de las capturas del tutorial
    primary: 'hsl(var(--primary))',
    secondary: 'hsl(var(--secondary))',
    background: 'hsl(var(--background))',
    card: 'hsl(var(--card))',
    muted: 'hsl(var(--muted))',
    border: 'hsl(var(--border))',
    
    // Colores específicos del calendario
    calendarRange: 'hsl(142 76% 36%)', // Verde sutil para el rango
    calendarRangeStart: 'hsl(142 86% 28%)', // Verde más fuerte para inicio/fin
    calendarSelected: 'hsl(210 40% 98%)', // Fondo seleccionado
    calendarHover: 'hsl(210 40% 96%)', // Hover state
    
    // Estados de la tabla
    tableHeaderBg: 'hsl(0 0% 98%)',
    tableRowHover: 'hsl(210 40% 98%)',
    linkColor: 'hsl(217 91% 60%)', // Azul para enlaces de empleados
    
    // Filtros y controles
    filterBorder: 'hsl(214 32% 91%)',
    filterBackground: 'hsl(0 0% 100%)',
    
    // Estados de datos
    informationMissing: 'hsl(38 92% 50%)', // Naranja para "Sin información"
  },
  
  spacing: {
    // Espaciados del diseño minimalista
    xs: '0.25rem', // 4px
    sm: '0.5rem',  // 8px
    md: '0.75rem', // 12px
    lg: '1rem',    // 16px
    xl: '1.5rem',  // 24px
    '2xl': '2rem', // 32px
    '3xl': '3rem', // 48px
  },
  
  radius: {
    // Radios redondeados como especifica el tutorial
    sm: '0.375rem', // 6px
    md: '0.5rem',   // 8px
    lg: '0.75rem',  // 12px
    xl: '1rem',     // 16px
  },
  
  shadows: {
    // Sombras sutiles del diseño
    subtle: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    card: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    modal: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  },
  
  typography: {
    // Tipografía Nunito Sans como especificado
    fontFamily: '"Nunito Sans", system-ui, sans-serif',
    fontSize: {
      xs: '0.75rem',   // 12px
      sm: '0.875rem',  // 14px
      base: '1rem',    // 16px
      lg: '1.125rem',  // 18px
      xl: '1.25rem',   // 20px
    },
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
} as const;