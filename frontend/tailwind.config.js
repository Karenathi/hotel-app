/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#3A1A28",
        lagon: {
          50: "#FDF2F6",
          100: "#FADCE7",
          500: "#E58AAE",
          700: "#B8527F",
        },
        corail: { 500: "#D6336C", 600: "#B82A5C" },
        fond: "#FBF5F7",
      },
      fontFamily: {
        titre: ['"Bricolage Grotesque"', "system-ui", "sans-serif"],
        corps: ["Figtree", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
