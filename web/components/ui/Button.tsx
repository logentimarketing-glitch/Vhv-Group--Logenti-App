import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary";
};

export function Button({ children, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      {...props}
      style={{
        border: variant === "primary" ? "none" : "1px solid rgba(31,41,55,0.1)",
        background: variant === "primary" ? "#0f766e" : "#ffffff",
        color: variant === "primary" ? "#ffffff" : "#1d2a2f",
        borderRadius: 999,
        padding: "0.85rem 1.15rem",
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}
