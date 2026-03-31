import { TalentDirectory } from "@/components/home/TalentDirectory";
import { getCurrentUser } from "@/lib/session";

export default async function TalentPage() {
  const user = await getCurrentUser();

  if (!user) {
    return <div className="panel">Necesitas iniciar sesion.</div>;
  }

  return (
    <div className="role-experience role-experience-admin stack-lg">
      <section className="section-heading admin-heading">
        <div>
          <p className="eyebrow admin-eyebrow">Usuarios y novatos</p>
          <h1>Perfiles seccionados por empresa</h1>
          <p className="section-copy admin-copy">
            Aqui puedes revisar perfiles por empresa y ubicar rapidamente a usuarios
            y personas en capacitacion.
          </p>
        </div>
      </section>

      <TalentDirectory viewer={{ matricula: user.matricula, role: user.role }} adminMode />
    </div>
  );
}
