/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        navy: { 800: "#1a2332", 900: "#0f1724" },
        badge: { gold: "#d4a843" },
      },
    },
  },
  plugins: [],
};
