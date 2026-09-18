// src/components/common/ThemeToggle.jsx
import { useEffect, useState } from "react";

const ThemeToggle = () => {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const saved = localStorage.getItem("theme") || "light";
    setTheme(saved);
    document.documentElement.setAttribute("data-theme", saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("theme", next);
    document.documentElement.setAttribute("data-theme", next);
  };

  const isLight = theme === "light";

  return (
    <button
      onClick={toggleTheme}
      style={{
        padding: "0.45rem 1.1rem",
        borderRadius: "999px",
        fontSize: "0.8rem",
        fontWeight: 600,
        cursor: "pointer",
        border: "1px solid transparent",
        transition: "all 0.2s ease",

        // LIGHT MODE STYLE
        background: isLight
          ? "rgba(99, 102, 241, 0.12)" // soft lavender tint
          : "rgba(255,255,255,0.08)", // glassy pill for dark mode

        color: isLight ? "#4f46e5" : "#e5e7eb",

        borderColor: isLight
          ? "rgba(99,102,241,0.32)"
          : "rgba(255,255,255,0.12)",

        backdropFilter: "blur(6px)",
      }}
    >
      {isLight ? "Dark mode" : "Light mode"}
    </button>
  );
};

export default ThemeToggle;
