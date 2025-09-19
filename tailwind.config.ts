import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
		"./node_modules/flowbite/**/*.js",
		"./node_modules/flowbite-react/lib/**/*.js",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				romance: {
					DEFAULT: 'hsl(var(--romance))',
					light: 'hsl(var(--romance-light))',
					dark: 'hsl(var(--romance-dark))'
				},
				'purple-accent': 'hsl(var(--purple-accent))',
				'date-pink': 'hsl(var(--date-pink))',
				'date-light-pink': 'hsl(var(--date-light-pink))',
				'date-purple': 'hsl(var(--date-purple))',
				'date-dark-gray': 'hsl(var(--date-dark-gray))',
				'date-light-gray': 'hsl(var(--date-light-gray))',
				'date-border': 'hsl(var(--date-border))',
				'communities-blue': 'hsl(var(--communities-blue))',
				'communities-green': 'hsl(var(--communities-green))',
				'communities-gray': 'hsl(var(--communities-gray))',
				'lobby-pink': 'hsl(var(--lobby-pink))',
				'lobby-pink-light': 'hsl(var(--lobby-pink-light))',
				'lobby-dark-gray': 'hsl(var(--lobby-dark-gray))',
				'message-background': 'hsl(var(--message-background))',
				'message-header': 'hsl(var(--message-header))',
				'message-title': 'hsl(var(--message-title))',
				'message-text': 'hsl(var(--message-text))',
				'message-border': 'hsl(var(--message-border))',
				'message-shadow': 'hsl(var(--message-shadow))',
				'message-pin-gold': 'hsl(var(--message-pin-gold))',
				'message-pin-red': 'hsl(var(--message-pin-red))',
				'message-blue': 'hsl(var(--message-blue))',
				'message-text-light': 'hsl(var(--message-text-light))',
				'message-mic': 'hsl(var(--message-mic))',
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			spacing: {
				'safe-top': 'env(safe-area-inset-top)',
				'safe-bottom': 'env(safe-area-inset-bottom)',
				'safe-left': 'env(safe-area-inset-left)',
				'safe-right': 'env(safe-area-inset-right)',
			},
			keyframes: {
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
				'pulse-scale': {
					'0%, 100%': { transform: 'scale(1)' },
					'50%': { transform: 'scale(1.05)' }
				},
				marquee: {
					from: { transform: 'translateX(0)' },
					to: { transform: 'translateX(calc(-100% - var(--gap)))' }
				},
				'marquee-vertical': {
					from: { transform: 'translateY(0)' },
					to: { transform: 'translateY(calc(-100% - var(--gap)))' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'pulse-scale': 'pulse-scale 2s ease-in-out infinite',
				'marquee': 'marquee var(--duration) linear infinite',
				'marquee-vertical': 'marquee-vertical var(--duration) linear infinite'
			}
		}
	},
	plugins: [require("tailwindcss-animate"), require("flowbite/plugin")],
} satisfies Config;
