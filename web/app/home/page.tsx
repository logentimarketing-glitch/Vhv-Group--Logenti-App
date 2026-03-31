import Link from "next/link";
import { getCurrentUser, getAdminDirectory } from "@/lib/session";
import { MemberFeed } from "@/components/home/MemberFeed";
import { AdminSpace } from "@/components/home/AdminSpace";
import { getUserStatus } from "@/lib/user-status";

export default async function HomeByRolePage() {
  const user = await getCurrentUser();
  const admins = getAdminDirectory();

  if (!user) {
    return (
      <div className="panel">
        <h1>Necesitas iniciar sesion</h1>
        <p className="section-copy">Entra con tu matricula para ver tu espacio.</p>
        <Link href="/login" className="primary-link">
          Ir a login
        </Link>
      </div>
    );
  }

  const status = getUserStatus(user);

  if (user.role === "administrador") {
    return (
      <div className="role-experience role-experience-admin">
        <section className="role-hero role-hero-clean">
          <div className="role-topline" />
          <div className="role-hero-grid">
            <div className="role-hero-copy">
              <p className="role-brand">{user.isMaster ? "VHV Master" : "VHV Group"}</p>
              <h1>Tu espacio administrativo y tus novedades en una sola vista</h1>
              <p className="role-welcome-copy">
                {user.isMaster
                  ? "Aqui puedes revisar tu espacio maestro, mantenerte al dia con las novedades del equipo y moverte entre control, personas y cursos sin salir de la misma experiencia."
                  : "Aqui encontraras una experiencia administrativa uniforme para entrar a tus modulos, revisar novedades y trabajar con el equipo sin cambios confusos de menu."}
              </p>
              <div className="role-action-row">
                <Link href="/community" className="role-chip-link">
                  Abrir novedades
                </Link>
                <Link href="/talent" className="secondary-link">
                  Ver personas
                </Link>
              </div>
              <p className="role-copy">
                {user.name} - {user.position}. Matricula {user.matricula}.
              </p>
            </div>
          </div>
        </section>

        <AdminSpace
          key={user.matricula}
          user={{
            matricula: user.matricula,
            name: user.name,
            email: user.email,
            position: user.position,
            role: "administrador",
            company: user.company,
          }}
        />
      </div>
    );
  }

  return (
    <div className="role-experience role-experience-member">
      <section className="role-hero role-hero-clean">
        <div className="role-topline" />
        <div className="role-hero-grid">
          <div className="role-hero-copy">
            <p className="role-brand">
              {user.isMaster ? "Logenti Master Feed" : "Logenti Mi Espacio"}
            </p>
            <h1>
              Tu perfil, tu directorio y tus novedades en una sola vista
            </h1>
            <p className="role-welcome-copy">
              Este es tu espacio personal. Aqui encontraras tu perfil, el equipo visible,
              publicaciones y las novedades que vayan apareciendo dentro de la plataforma.
            </p>
            <div className="role-action-row">
              {user.role === "novato" ? (
                <Link href="/lms" className="role-chip-link">
                  Ver cursos
                </Link>
              ) : (
                <Link href="/settings" className="role-chip-link">
                  Editar perfil
                </Link>
              )}
              <Link href="/community" className="secondary-link">
                Ver novedades
              </Link>
            </div>
            <p className="role-copy">
              {user.name} - {user.position}. Matricula {user.matricula}.
            </p>
          </div>
        </div>
      </section>

      <MemberFeed key={user.matricula} user={user} admins={admins} />
    </div>
  );
}
