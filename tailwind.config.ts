import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		fontFamily: {
			sans: ['var(--font-family-sans)', 'sans-serif'],
			serif: ['var(--font-family-serif)', 'serif'],
			mono: ['var(--font-family-mono)', 'monospace'],
		},
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			spacing: {
				'0': 'var(--spacing-0)',
				'1': 'var(--spacing-1)',     // 4px
				'2': 'var(--spacing-2)',     // 8px - base unit
				'3': 'var(--spacing-3)',     // 12px
				'4': 'var(--spacing-4)',     // 16px
				'6': 'var(--spacing-6)',     // 24px
				'8': 'var(--spacing-8)',     // 32px
				'12': 'var(--spacing-12)',   // 96px
				'sidebar': 'var(--spacing-sidebar)', // 224px
				'clickable': 'var(--spacing-clickable)', // 30px
			},
			width: {
				'sidebar': 'var(--layout-sidebar-width)',
			},
			height: {
				'clickable': 'var(--spacing-clickable)',
			},
			fontSize: {
				xs: ['var(--text-xs)', { lineHeight: 'var(--leading-normal)' }],
				sm: ['var(--text-sm)', { lineHeight: 'var(--leading-normal)' }],
				base: ['var(--text-base)', { lineHeight: 'var(--leading-normal)' }],
				lg: ['var(--text-lg)', { lineHeight: 'var(--leading-tight)' }],
				xl: ['var(--text-xl)', { lineHeight: 'var(--leading-tight)' }],
				'2xl': ['var(--text-2xl)', { lineHeight: 'var(--leading-tight)' }],
				'3xl': ['var(--text-3xl)', { lineHeight: 'var(--leading-tight)' }],
			},
			fontWeight: {
				normal: 'var(--font-weight-normal)',
				medium: 'var(--font-weight-medium)',
				semibold: 'var(--font-weight-semibold)',
				bold: 'var(--font-weight-bold)',
			},
			lineHeight: {
				tight: 'var(--leading-tight)',
				normal: 'var(--leading-normal)',
				relaxed: 'var(--leading-relaxed)',
			},
			colors: {
				border: 'var(--border)',
				input: 'var(--input)',
				ring: 'var(--ring)',
				background: 'var(--background)',
				foreground: 'var(--foreground)',
				primary: {
					DEFAULT: 'var(--primary)',
					foreground: 'var(--primary-foreground)'
				},
				secondary: {
					DEFAULT: 'var(--secondary)',
					foreground: 'var(--secondary-foreground)'
				},
				destructive: {
					DEFAULT: 'var(--destructive)',
					foreground: 'var(--destructive-foreground)'
				},
				muted: {
					DEFAULT: 'var(--muted)',
					foreground: 'var(--muted-foreground)'
				},
				accent: {
					DEFAULT: 'var(--accent)',
					foreground: 'var(--accent-foreground)'
				},
				popover: {
					DEFAULT: 'var(--popover)',
					foreground: 'var(--popover-foreground)'
				},
				card: {
					DEFAULT: 'var(--card)',
					foreground: 'var(--card-foreground)'
				},
				sidebar: {
					DEFAULT: 'var(--sidebar)',
					foreground: 'var(--sidebar-foreground)',
					primary: 'var(--sidebar-primary)',
					'primary-foreground': 'var(--sidebar-primary-foreground)',
					accent: 'var(--sidebar-accent)',
					'accent-foreground': 'var(--sidebar-accent-foreground)',
					border: 'var(--sidebar-border)',
					ring: 'var(--sidebar-ring)'
				},
				// Notion accent colors - text variants
				'notion-gray': {
					text: 'var(--accent-gray-text)',
					bg: 'var(--accent-gray-bg)'
				},
				'notion-brown': {
					text: 'var(--accent-brown-text)',
					bg: 'var(--accent-brown-bg)'
				},
				'notion-orange': {
					text: 'var(--accent-orange-text)',
					bg: 'var(--accent-orange-bg)'
				},
				'notion-yellow': {
					text: 'var(--accent-yellow-text)',
					bg: 'var(--accent-yellow-bg)'
				},
				'notion-green': {
					text: 'var(--accent-green-text)',
					bg: 'var(--accent-green-bg)'
				},
				'notion-blue': {
					text: 'var(--accent-blue-text)',
					bg: 'var(--accent-blue-bg)'
				},
				'notion-purple': {
					text: 'var(--accent-purple-text)',
					bg: 'var(--accent-purple-bg)'
				},
				'notion-pink': {
					text: 'var(--accent-pink-text)',
					bg: 'var(--accent-pink-bg)'
				},
				'notion-red': {
					text: 'var(--accent-red-text)',
					bg: 'var(--accent-red-bg)'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				// Accordion animations
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				// Notion-style microinteractions
				'fade-in': {
					'0%': {
						opacity: '0',
						transform: 'translateY(4px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'fade-out': {
					'0%': {
						opacity: '1',
						transform: 'translateY(0)'
					},
					'100%': {
						opacity: '0',
						transform: 'translateY(4px)'
					}
				},
				'slide-down': {
					'0%': {
						opacity: '0',
						transform: 'translateY(-8px)'
					},
					'100%': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				'slide-up': {
					'0%': {
						opacity: '1',
						transform: 'translateY(0)'
					},
					'100%': {
						opacity: '0',
						transform: 'translateY(-8px)'
					}
				},
				'scale-in': {
					'0%': {
						opacity: '0',
						transform: 'scale(0.95)'
					},
					'100%': {
						opacity: '1',
						transform: 'scale(1)'
					}
				},
				'scale-out': {
					'0%': {
						opacity: '1',
						transform: 'scale(1)'
					},
					'100%': {
						opacity: '0',
						transform: 'scale(0.95)'
					}
				},
				// Rotation for chevrons/arrows
				'rotate-90': {
					'0%': { transform: 'rotate(0deg)' },
					'100%': { transform: 'rotate(90deg)' }
				},
				'rotate-back': {
					'0%': { transform: 'rotate(90deg)' },
					'100%': { transform: 'rotate(0deg)' }
				},
				// Drag and drop indicators
				'drag-indicate': {
					'0%': { opacity: '0', transform: 'scaleX(0)' },
					'100%': { opacity: '1', transform: 'scaleX(1)' }
				},
				// Skeleton loading
				'skeleton-pulse': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.4' }
				},
				// Check animation for checkboxes
				'check-appear': {
					'0%': { 
						opacity: '0', 
						transform: 'scale(0.5)' 
					},
					'100%': { 
						opacity: '1', 
						transform: 'scale(1)' 
					}
				},
				// Button press feedback
				'button-press': {
					'0%': { transform: 'scale(1)' },
					'50%': { transform: 'scale(0.98)' },
					'100%': { transform: 'scale(1)' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				// Notion microinteractions with precise timing
				'fade-in': 'fade-in 0.15s ease-out',
				'fade-out': 'fade-out 0.1s ease-in',
				'slide-down': 'slide-down 0.2s ease-out',
				'slide-up': 'slide-up 0.15s ease-in',
				'scale-in': 'scale-in 0.1s ease-out',
				'scale-out': 'scale-out 0.1s ease-in',
				'rotate-90': 'rotate-90 0.2s ease-out',
				'rotate-back': 'rotate-back 0.2s ease-out',
				'drag-indicate': 'drag-indicate 0.15s ease-out',
				'skeleton-pulse': 'skeleton-pulse 1.5s ease-in-out infinite',
				'check-appear': 'check-appear 0.2s ease-out',
				'button-press': 'button-press 0.1s ease-out',
			},
			// Transition timing functions for consistency
			transitionTimingFunction: {
				'notion-ease': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
				'notion-ease-out': 'cubic-bezier(0, 0, 0.2, 1)',
				'notion-ease-in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
} satisfies Config;
