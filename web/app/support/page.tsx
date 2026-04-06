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
          <h1>Asistente de soporte tecnico</h1>
          <p className="section-copy">
            Aqui tienes un menu guiado para introduccion, acceso a cursos y atencion humana.
            Si el bot no puede resolver tu problema, escribe HUMANO y tu caso se escala con Logenti.
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
