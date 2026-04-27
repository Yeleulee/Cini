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
                hero:    ["'Bebas Neue'", 'Impact', 'system-ui', 'sans-serif'],
                display: ['Outfit', 'system-ui', 'sans-serif'],
                body:    ['Inter', 'system-ui', 'sans-serif'],
                serif:   ['Cinzel', 'Georgia', 'serif'],
            },
            animation: {
                'ken-burns': 'kenBurns 18s ease-in-out infinite',
            },
        },
    },
    plugins: [],
}
