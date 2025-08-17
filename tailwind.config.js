/** @type {import('tailwindcss').Config} */
// tailwind.config.js
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          pink: "#FF6FA9",     // da logo
          navy: "#1E1B4B",     // da logo
          cream: "#FFF7F9",    // fundos suaves
          mint: "#D6F5EA",     // detalhes
          yellow: "#FFD166",   // alerta/observação
        },
      },
      boxShadow: {
        soft: "0 6px 24px rgba(30,27,75,0.06)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      fontFamily: {
        display: ["Poppins", "ui-sans-serif", "system-ui"],
        body: ["Inter", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
};