/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: "#0f172a",
        glassBg: "rgba(30, 41, 59, 0.7)",
      }
    },
  },
  plugins: [],
}
