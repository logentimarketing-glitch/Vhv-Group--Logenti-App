import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export default function Input(props: InputProps) {
  return (
    <input
      {...props}
      style={{
        padding: "0.5rem",
        borderRadius: "6px",
        border: "1px solid #ccc",
        width: "100%",
      }}
    />
  );
}