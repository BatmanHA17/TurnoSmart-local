// Tokens de diseño extraídos de la imagen de Sign In de Combo
export const signinDesignTokens = {
  colors: {
    // Fondo general - beige claro cálido
    pageBackground: 'hsl(45, 25%, 95%)', // #F5F4F0 - fondo beige claro
    
    // Tarjeta/Modal central
    cardBackground: 'hsl(0, 0%, 100%)', // Fondo blanco puro
    cardBorder: 'hsl(0, 0%, 92%)', // Borde muy sutil
    
    // Texto principal
    titleText: 'hsl(0, 0%, 20%)', // Negro cálido para títulos
    bodyText: 'hsl(0, 0%, 40%)', // Gris para texto secundario
    labelText: 'hsl(0, 0%, 25%)', // Texto de labels
    
    // Enlaces
    linkText: 'hsl(195, 85%, 45%)', // Azul turquesa para enlaces
    linkHover: 'hsl(195, 85%, 35%)', // Azul más oscuro en hover
    
    // Campos de entrada
    inputBackground: 'hsl(0, 0%, 98%)', // Fondo muy claro
    inputBorder: 'hsl(0, 0%, 85%)', // Borde sutil
    inputBorderFocus: 'hsl(195, 85%, 45%)', // Borde azul en focus
    inputText: 'hsl(0, 0%, 20%)', // Texto del input
    inputPlaceholder: 'hsl(0, 0%, 60%)', // Placeholder gris
    
    // Iconos en campos
    inputIconColor: 'hsl(0, 0%, 60%)', // Iconos grises en inputs
    inputIconHover: 'hsl(0, 0%, 40%)', // Iconos en hover
    
    // Botón principal
    primaryButtonBg: 'hsl(167, 85%, 25%)', // Verde oscuro teal
    primaryButtonHover: 'hsl(167, 85%, 20%)', // Verde más oscuro en hover
    primaryButtonText: 'hsl(0, 0%, 100%)', // Texto blanco
    
    // Header
    headerText: 'hsl(0, 0%, 30%)', // Gris oscuro para navegación
    headerLink: 'hsl(0, 0%, 50%)', // Enlaces del header
    
    // Estados de validación
    errorText: 'hsl(0, 85%, 50%)', // Rojo para errores
    errorBorder: 'hsl(0, 85%, 45%)', // Borde rojo en error
  },
  
  spacing: {
    // Espaciados específicos de la interfaz
    cardPadding: '2rem', // 32px - padding interno de la tarjeta
    fieldSpacing: '1rem', // 16px - espacio entre campos
    buttonHeight: '3rem', // 48px - altura del botón
    inputHeight: '2.75rem', // 44px - altura de inputs
    headerPadding: '1.5rem', // 24px - padding del header
  },
  
  radius: {
    // Radios específicos
    card: '0.75rem', // 12px - esquinas de la tarjeta
    input: '0.375rem', // 6px - esquinas de inputs
    button: '0.5rem', // 8px - esquinas del botón
  },
  
  shadows: {
    // Sombras de la interfaz
    card: '0 4px 25px 0 rgba(0, 0, 0, 0.05)', // Sombra suave de la tarjeta
    cardHover: '0 8px 30px 0 rgba(0, 0, 0, 0.08)', // Sombra en hover (opcional)
    input: '0 1px 3px 0 rgba(0, 0, 0, 0.05)', // Sombra muy sutil en inputs
    inputFocus: '0 0 0 3px rgba(59, 130, 246, 0.1)', // Ring de focus
  },
  
  typography: {
    // Tipografía específica - usando Nunito Sans
    fontFamily: 'var(--font-family-sans)', // Nunito Sans del sistema
    
    // Tamaños específicos
    titleSize: '1.75rem', // 28px - título principal
    subtitleSize: '0.875rem', // 14px - subtítulo
    labelSize: '0.875rem', // 14px - labels
    inputSize: '1rem', // 16px - texto de input
    linkSize: '0.875rem', // 14px - enlaces
    buttonSize: '1rem', // 16px - texto de botón
    
    // Pesos
    titleWeight: '600', // Semibold para el título
    labelWeight: '500', // Medium para labels
    bodyWeight: '400', // Regular para texto normal
    buttonWeight: '500', // Medium para botones
  },
  
  transitions: {
    // Transiciones suaves
    default: 'all 0.2s ease-in-out',
    fast: 'all 0.15s ease-in-out',
    slow: 'all 0.3s ease-in-out',
  },
} as const;