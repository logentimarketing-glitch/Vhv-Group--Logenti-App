"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [matricula, setMatricula] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matricula, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.error ?? "No fue posible iniciar sesion.");
      setLoading(false);
      return;
    }

    router.push(data.redirectTo ?? "/dashboard");
    router.refresh();
  }

  return (
    <div className="auth-shell">
      <section className="auth-card">
        <div className="stack-md">
          <div>
            <p className="eyebrow">Acceso por matricula</p>
            <h1>Entrar a VHV Talent OS</h1>
            <p className="section-copy">
              Inicia sesion como administrador, novato o usuario para entrar a
              tus paneles, talleres y seguimiento.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="stack-sm">
            <label className="field">
              <span>Matricula</span>
              <input value={matricula} onChange={(e) => setMatricula(e.target.value)} />
            </label>
            <label className="field">
              <span>Contrasena</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button type="submit" className="primary-link action-button" disabled={loading}>
              {loading ? "Entrando..." : "Iniciar sesion"}
            </button>
            {error ? <p className="error-text">{error}</p> : null}
          </form>
        </div>
      </section>
    </div>
  );
}
