/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./index.tsx",
        "./App.tsx",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./services/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans:    ['ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Inter', 'sans-serif'],
                hero:    ['ui-sans-serif', 'system-ui', 'sans-serif'],
                display: ['ui-sans-serif', 'system-ui', 'sans-serif'],
                body:    ['ui-sans-serif', 'system-ui', 'sans-serif'],
                serif:   ['ui-sans-serif', 'system-ui', 'sans-serif'],
            },
            colors: {
                surface: {
                    DEFAULT: '#050505',
                    raised:  '#17171b',
                    strong:  '#1e1e24',
                },
            },
            animation: {
                'ken-burns': 'kenBurns 18s ease-in-out infinite',
            },
        },
    },
    plugins: [],
}
