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
                    DEFAULT: '#FF00CC', // Vibrant Pink
                    50: '#ffe5f9',
                    100: '#ffccf3',
                    200: '#ff99e7',
                    300: '#ff66db',
                    400: '#ff33cf',
                    500: '#FF00CC',
                    600: '#cc00a3',
                    700: '#99007a',
                    800: '#660052',
                    900: '#330029',
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
                    primary: 'var(--bg-primary)',
                    secondary: 'var(--bg-secondary)',
                    tertiary: 'var(--bg-tertiary)',
                    elevated: 'var(--bg-elevated)',
                },
                text: {
                    primary: 'var(--text-primary)',
                    secondary: 'var(--text-secondary)',
                    tertiary: 'var(--text-tertiary)',
                },
                border: {
                    color: 'var(--border-color)',
                    hover: 'var(--border-hover)',
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
