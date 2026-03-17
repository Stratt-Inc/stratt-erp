/**
 * Highlight — remplace les dégradés de texte.
 * variant "mark"      → fond surligneur (marker pen)
 * variant "underline" → souligné décoratif épais
 * variant "box"       → encadré coloré subtil
 */

interface HighlightProps {
  children: React.ReactNode;
  variant?: "mark" | "underline" | "box";
  color?: "blue" | "teal" | "violet" | "amber" | "green";
  className?: string;
}

const COLOR_MAP = {
  blue:   { mark: "rgba(92,147,255,0.18)",  line: "#5C93FF",  text: "#1a3a7a" },
  teal:   { mark: "rgba(36,221,184,0.18)",  line: "#24DDB8",  text: "#0a5245" },
  violet: { mark: "rgba(139,92,246,0.15)",  line: "#8B5CF6",  text: "#4c1d95" },
  amber:  { mark: "rgba(245,158,11,0.18)",  line: "#F59E0B",  text: "#78350f" },
  green:  { mark: "rgba(16,185,129,0.16)",  line: "#10B981",  text: "#064e3b" },
};

export function Highlight({
  children,
  variant = "mark",
  color = "blue",
  className = "",
}: HighlightProps) {
  const c = COLOR_MAP[color];

  if (variant === "mark") {
    return (
      <mark
        className={className}
        style={{
          background: c.mark,
          color: "inherit",
          borderRadius: 3,
          padding: "0 3px",
          marginInline: 1,
        }}
      >
        {children}
      </mark>
    );
  }

  if (variant === "underline") {
    return (
      <span
        className={className}
        style={{
          textDecoration: "underline",
          textDecorationColor: c.line,
          textDecorationThickness: 3,
          textUnderlineOffset: 4,
          color: "inherit",
        }}
      >
        {children}
      </span>
    );
  }

  // box
  return (
    <span
      className={className}
      style={{
        background: c.mark,
        color: c.text,
        borderRadius: 4,
        padding: "0 5px 1px",
        fontWeight: 700,
      }}
    >
      {children}
    </span>
  );
}
