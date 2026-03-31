import { getCurrentUser } from "@/lib/session";
import { getAdminPermissions } from "@/lib/admin-permissions";
import { socialLinks } from "@/lib/social-links";

export default async function MarketingPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "administrador") {
    return <div className="panel">Necesitas iniciar sesion.</div>;
  }

  const permissions = getAdminPermissions(user);

  if (!permissions.canManageMarketing) {
    return (
      <div className="panel">
        <div className="empty-state admin-empty-state">
          <strong>Tu puesto no administra marketing.</strong>
          <p>Este modulo esta reservado para perfiles de marketing, comunicacion, liderazgo autorizado y la cuenta master.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="stack-lg">
      <section className="section-heading">
        <div>
          <p className="eyebrow">Modulo de marketing</p>
          <h1>Publicacion en redes por administradores autorizados</h1>
          <p className="section-copy">
            Este espacio sirve para preparar contenido, validar permisos y enviar
            piezas a redes sociales desde un solo panel.
          </p>
        </div>
      </section>

      <section className="card-grid content-split">
        <article className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Canales</p>
              <h2>Canales de captacion</h2>
            </div>
          </div>
          <div className="stack-sm">
            {socialLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noreferrer"
                className="vacancy-card social-link-card"
              >
                <strong>{link.name}</strong>
                <p>{link.href}</p>
              </a>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Cola editorial</p>
              <h2>Flujo de interesados</h2>
            </div>
          </div>
          <div className="empty-state">
            <strong>La conexion de captacion quedara lista en cuanto se autorice la integracion.</strong>
            <p>
              El dashboard ya esta preparado para recibir candidatos y filtrarlos.
              Lo siguiente es conectar oficialmente Meta para traer los leads reales.
            </p>
          </div>
        </article>
      </section>
    </div>
  );
}
