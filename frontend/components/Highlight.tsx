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
  blue:   { mark: "hsl(var(--primary) / 0.18)",  line: "hsl(var(--primary))",  text: "#1a3a7a" },
  teal:   { mark: "hsl(var(--accent) / 0.18)",   line: "hsl(var(--accent))",   text: "#0a5245" },
  violet: { mark: "hsl(var(--violet) / 0.15)",   line: "hsl(var(--violet))",   text: "#4c1d95" },
  amber:  { mark: "hsl(var(--warning) / 0.18)",  line: "hsl(var(--warning))",  text: "#78350f" },
  green:  { mark: "hsl(var(--success) / 0.16)",  line: "hsl(var(--success))",  text: "#064e3b" },
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
