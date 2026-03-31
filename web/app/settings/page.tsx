import { getCurrentUser } from "@/lib/session";
import { ProfileEditor } from "@/components/settings/ProfileEditor";
import { LogoutSection } from "@/components/settings/LogoutSection";
import { getUserStatus } from "@/lib/user-status";

export default async function SettingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="panel">
        <h1>Necesitas iniciar sesion</h1>
      </div>
    );
  }

  const status = getUserStatus(user);

  return (
    <div className="stack-lg">
      <section className="section-heading">
        <div>
          <p className="eyebrow">Perfiles y permisos</p>
          <h1>Tu perfil</h1>
          <p className="section-copy">
            {status === "TRAINEE"
              ? "Tu cuenta trainee se mantiene en modo guiado. Aqui solo veras el estado de tu acceso, tus datos bloqueados y la salida de sesion."
              : "Tu perfil ahora se organiza como una vista social, con portada, foto, informacion y edicion en el mismo lugar."}
          </p>
        </div>
      </section>

      <ProfileEditor key={user.matricula} user={user} />
      <LogoutSection />
    </div>
  );
}
