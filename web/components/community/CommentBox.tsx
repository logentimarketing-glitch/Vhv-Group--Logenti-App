"use client";

import { useState } from "react";

type CommentBoxProps = {
  placeholder?: string;
  onSubmit?: (value: string) => void;
};

export default function CommentBox({
  placeholder = "Escribe una observacion o comentario profesional...",
  onSubmit,
}: CommentBoxProps) {
  const [value, setValue] = useState("");

  function handleSubmit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit?.(trimmed);
    setValue("");
  }

  return (
    <div className="stack-sm">
      <textarea
        className="field textarea"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        rows={4}
        placeholder={placeholder}
      />
      <button type="button" className="primary-link action-button" onClick={handleSubmit}>
        Publicar comentario
      </button>
    </div>
  );
}
