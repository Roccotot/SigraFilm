/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./app/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1d4ed8",   // blu principale
        secondary: "#9333ea", // viola secondario
        accent: "#f59e0b",    // arancione accento
      },
    },
  },
  plugins: [],
};
