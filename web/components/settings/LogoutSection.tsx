"use client";

import { useRouter } from "next/navigation";

export function LogoutSection() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <section className="role-surface">
      <p className="role-section-label">Sesion</p>
      <h2>Cerrar sesion</h2>
      <p>Cuando termines tu gestion, puedes salir de forma segura desde aqui.</p>
      <div className="hero-actions">
        <button type="button" className="primary-link action-button" onClick={logout}>
          Cerrar sesion
        </button>
      </div>
    </section>
  );
}
