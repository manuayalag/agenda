/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2A8C82",
        secondary: "#41BFB3",
        tertiary: "#9BF2EA",
        darkgreen: "#275950",
        darkred: "#260101",
      },
    },
  },
  plugins: [],
}
