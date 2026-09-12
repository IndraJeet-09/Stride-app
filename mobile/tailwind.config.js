/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#090909",
          secondary: "#0D0D0D",
          tertiary: "#111111",
        },
        surface: {
          DEFAULT: "#151515",
          card: "#181818",
          hover: "#1D1D1D",
        },
        border: {
          DEFAULT: "#272727",
          subtle: "#303030",
        },
        text: {
          primary: "#F5F5F5",
          secondary: "#A1A1AA",
          muted: "#71717A",
        },
        brand: {
          DEFAULT: "#C2410C", // Deep burnt orange
          darkRed: "#9F2D14", // Red-orange
          bright: "#D4511E", // Active ember state
          subtle: "#5F2415", // Subtle background orange
          muted: "#3B160C",
        },
        contrib: {
          0: "#181818", // No activity
          1: "#4A1D12", // Low
          2: "#71301A", // Medium-low
          3: "#9F3A18", // Medium
          4: "#C2410C", // High ember
        },
      },
    },
  },
  plugins: [],
};
