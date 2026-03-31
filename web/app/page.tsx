import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (user) {
    if (user.role === "administrador") {
      return (
        <div className="role-experience role-experience-admin">
          <section className="role-hero role-hero-clean">
            <div className="role-topline" />
            <div className="role-hero-grid">
              <div className="role-hero-copy">
                <p className="role-brand">{user.isMaster ? "VHV Master" : "VHV Group"}</p>
                <h1>Capacitacion y administracion del personal del corporativo VHV Group</h1>
                <p className="role-welcome-copy">
                  Bienvenido a tu acceso administrativo. Desde aqui podras entrar a control, pipeline, personas,
                  cursos, novedades y marketing con una experiencia consistente para todo el personal administrativo.
                </p>
                <div className="role-action-row">
                  <Link href="/dashboard" className="role-chip-link">
                    Ir al panel
                  </Link>
                  <Link href="/community" className="secondary-link">
                    Ver novedades
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className="landing-grid landing-grid-admin">
            <article className="landing-card">
              <p className="eyebrow admin-eyebrow">Reclutamiento</p>
              <h2>Embudo, entrevistas y seguimiento</h2>
              <p className="section-copy">
                Administra vacantes, interesados y filtros de IA desde una estructura ordenada y clara.
              </p>
            </article>
            <article className="landing-card">
              <p className="eyebrow admin-eyebrow">Capacitacion</p>
              <h2>Aulas por perfil, empresa y nivel</h2>
              <p className="section-copy">
                Cada curso puede exigir clave y elegibilidad para que solo entre quien realmente corresponde.
              </p>
            </article>
            <article className="landing-card">
              <p className="eyebrow admin-eyebrow">Comunidad</p>
              <h2>Contenido, soporte y novedades</h2>
              <p className="section-copy">
                El equipo publica, comenta y recibe acompanamiento sin mezclar funciones sensibles con operacion diaria.
              </p>
            </article>
          </section>
        </div>
      );
    }

    redirect("/community");
  }

  return (
    <div className="public-home-shell">
      <section className="public-home-hero">
        <div className="public-home-copy">
          <p className="eyebrow">VHV Group</p>
          <h1>Web de capacitacion y administracion del personal del corporativo VHV Group</h1>
          <p className="hero-text">
            Una sola plataforma para reclutamiento, cursos, novedades, directorio, soporte y seguimiento
            operativo del talento en formato web y app.
          </p>
          <div className="hero-actions">
            <Link href="/login" className="primary-link">
              Iniciar sesion
            </Link>
            <Link href="/community" className="secondary-link">
              Explorar novedades
            </Link>
          </div>
        </div>

        <div className="public-home-stack">
          <article className="public-home-card">
            <p className="eyebrow">Capacitacion</p>
            <h2>Cursos por rol, empresa y nivel</h2>
            <p className="section-copy">
              Novatos, usuarios y administradores acceden solo a lo que corresponde a su recorrido.
            </p>
          </article>
          <article className="public-home-card">
            <p className="eyebrow">Administracion</p>
            <h2>Control operativo por puesto</h2>
            <p className="section-copy">
              No todos los administradores ven lo mismo: cada panel se adapta al alcance real del puesto.
            </p>
          </article>
          <article className="public-home-card">
            <p className="eyebrow">Comunidad</p>
            <h2>Novedades, soporte y publicaciones</h2>
            <p className="section-copy">
              El personal puede recibir avisos, resolver dudas y compartir contenido de forma ordenada.
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
