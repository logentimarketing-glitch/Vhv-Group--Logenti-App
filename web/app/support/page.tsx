import { getCurrentUser } from "@/lib/session";
import { SupportCenter } from "@/components/community/SupportCenter";
import { getUserStatus } from "@/lib/user-status";

export default async function SupportPage() {
  const user = await getCurrentUser();

  if (!user) {
    return <div className="panel">Necesitas iniciar sesion.</div>;
  }

  const status = getUserStatus(user);

  return (
    <div className="stack-lg">
      <section className="section-heading">
        <div>
          <p className="eyebrow">Soporte tecnico</p>
          <h1>Soporte tecnico disponible para ti</h1>
          <p className="section-copy">
            Aqui tienes a tu disposicion soporte tecnico para dudas generales, seguimiento y claves de cursos.
            Si tu caso necesita atencion humana, el sistema lo escala con administracion.
          </p>
        </div>
      </section>

      <SupportCenter
        user={{
          matricula: user.matricula,
          name: user.name,
          role: user.role,
          status,
        }}
      />
    </div>
  );
}
