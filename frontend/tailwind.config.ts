import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172b3a",
        muted: "#71808c",
        line: "#e7ecef",
        canvas: "#f5f7f8",
        teal: "#147d75",
      },
      boxShadow: {
        card: "0 8px 30px rgba(25, 48, 62, 0.045)",
      },
    },
  },
  plugins: [],
};

export default config;
