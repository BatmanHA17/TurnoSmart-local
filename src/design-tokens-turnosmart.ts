// Design tokens extracted from combohr.com
export const turnoSmartDesignTokens = {
  colors: {
    // Primary brand colors
    primary: "hsl(47, 100%, 50%)", // Yellow from Combo logo
    primaryHover: "hsl(47, 100%, 45%)",
    
    // Text colors
    textPrimary: "hsl(220, 15%, 20%)", // Dark gray for headings
    textSecondary: "hsl(220, 10%, 45%)", // Medium gray for body text
    textMuted: "hsl(220, 5%, 65%)", // Light gray for muted text
    
    // Background colors
    backgroundPrimary: "hsl(0, 0%, 100%)", // Pure white
    backgroundSecondary: "hsl(220, 20%, 98%)", // Very light gray
    backgroundAccent: "hsl(47, 100%, 96%)", // Very light yellow
    
    // Border colors
    border: "hsl(220, 15%, 90%)",
    borderLight: "hsl(220, 10%, 95%)",
    
    // Button colors
    buttonPrimary: "hsl(220, 15%, 20%)", // Dark button
    buttonSecondary: "hsl(0, 0%, 100%)", // White button
    buttonOutline: "hsl(220, 15%, 90%)", // Outlined button
    
    // Rating colors
    starYellow: "hsl(45, 100%, 51%)",
    
    // Company logo colors
    logoBlue: "hsl(220, 100%, 50%)",
    logoGreen: "hsl(120, 100%, 35%)",
    logoRed: "hsl(0, 100%, 50%)",
  },
  
  spacing: {
    xs: "0.25rem", // 4px
    sm: "0.5rem",  // 8px
    md: "1rem",    // 16px
    lg: "1.5rem",  // 24px
    xl: "2rem",    // 32px
    "2xl": "3rem", // 48px
    "3xl": "4rem", // 64px
    "4xl": "6rem", // 96px
    "5xl": "8rem", // 128px
    "6xl": "12rem", // 192px
  },
  
  typography: {
    fontFamily: {
      sans: ["Inter", "system-ui", "sans-serif"],
      heading: ["Inter", "system-ui", "sans-serif"],
    },
    fontSize: {
      xs: "0.75rem",    // 12px
      sm: "0.875rem",   // 14px
      base: "1rem",     // 16px
      lg: "1.125rem",   // 18px
      xl: "1.25rem",    // 20px
      "2xl": "1.5rem",  // 24px
      "3xl": "1.875rem", // 30px
      "4xl": "2.25rem", // 36px
      "5xl": "3rem",    // 48px
      "6xl": "3.75rem", // 60px
      "7xl": "4.5rem",  // 72px
    },
    fontWeight: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
      extrabold: "800",
    },
    lineHeight: {
      tight: "1.25",
      snug: "1.375",
      normal: "1.5",
      relaxed: "1.625",
      loose: "2",
    },
  },
  
  borderRadius: {
    none: "0",
    sm: "0.125rem", // 2px
    md: "0.375rem", // 6px
    lg: "0.5rem",   // 8px
    xl: "0.75rem",  // 12px
    "2xl": "1rem",  // 16px
    full: "9999px",
  },
  
  shadows: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    "2xl": "0 25px 50px -12px rgb(0 0 0 / 0.25)",
  },
  
  animations: {
    duration: {
      fast: "150ms",
      normal: "300ms",
      slow: "500ms",
    },
    easing: {
      easeIn: "cubic-bezier(0.4, 0, 1, 1)",
      easeOut: "cubic-bezier(0, 0, 0.2, 1)",
      easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    },
  },
  
  breakpoints: {
    sm: "640px",
    md: "768px",
    lg: "1024px",
    xl: "1280px",
    "2xl": "1536px",
  },
};

export default turnoSmartDesignTokens;