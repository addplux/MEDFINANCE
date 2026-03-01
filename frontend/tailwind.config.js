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
