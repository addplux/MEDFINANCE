/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: '#3B82F6', // Reference Blue
                    50: '#eff6ff',
                    100: '#dbeafe',
                    200: '#bfdbfe',
                    300: '#93c5fd',
                    400: '#60a5fa',
                    500: '#3b82f6',
                    600: '#2563eb',
                    700: '#1d4ed8',
                    800: '#1e40af',
                    900: '#1e3a8a',
                },
                accent: {
                    DEFAULT: '#0EA5E9', // Reference Light Blue
                },
                bg: {
                    primary: '#f8fafc', // Slate 50 (Main body background)
                    secondary: '#ffffff', // White (Cards)
                    tertiary: '#f1f5f9', // Slate 100 (Hover/Header)
                    elevated: '#ffffff', // White
                },
                text: {
                    primary: '#0f172a', // Slate 900
                    secondary: '#64748b', // Slate 500
                    tertiary: '#94a3b8', // Slate 400
                },
                border: {
                    color: '#e2e8f0', // Slate 200
                    hover: '#cbd5e1', // Slate 300
                }
            },
                accent: {
                    DEFAULT: '#00EAFF',
                },
                bg: {
                    primary: '#000000', // Reference Stark Black
                    secondary: '#09090b', // Reference Elevated Zinc-950
                    tertiary: '#18181b', // Reference Card Zinc-900
                    elevated: '#27272a', // Reference Border Zinc-800
                },
                text: {
                    primary: '#FFFFFF',
                    secondary: '#a1a1aa', // Zinc-400
                    tertiary: '#71717a', // Zinc-500
                },
                border: {
                    color: '#27272a', // Zinc-800
                    hover: '#3f3f46', // Zinc-700
                }
            },
                accent: {
                    DEFAULT: '#00EAFF', // Electric Cyan
                    50: '#e5fdff',
                    100: '#ccfaff',
                    200: '#99f5ff',
                    300: '#66f0ff',
                    400: '#33ebff',
                    500: '#00EAFF',
                    600: '#00bbcc',
                    700: '#008c99',
                    800: '#005e66',
                    900: '#002f33',
                },
                highlight: {
                    DEFAULT: '#FF9500', // Vivid Orange
                    50: '#fff4e5',
                    100: '#ffe9cc',
                    200: '#ffd399',
                    300: '#ffbd66',
                    400: '#ffa733',
                    500: '#FF9500',
                },
                bg: {
                    primary: '#080808', // Deep Black
                    secondary: '#121212', // Dark Charcoal
                    tertiary: '#1A1A1A', // Slate Gray
                    elevated: '#242424',
                },
                text: {
                    primary: '#FFFFFF',
                    secondary: '#A1A1A1',
                    tertiary: '#717171',
                },
                border: {
                    color: '#2A2A2A',
                    hover: '#3A3A3A',
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                serif: ['Playfair Display', 'serif'],
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out forwards',
                'gradient': 'gradient 8s linear infinite',
                'float': 'float 6s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                gradient: {
                    '0%, 100%': {
                        'background-size': '200% 200%',
                        'background-position': 'left center'
                    },
                    '50%': {
                        'background-size': '200% 200%',
                        'background-position': 'right center'
                    },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-20px)' },
                },
            },
        },
    },
    plugins: [],
}
