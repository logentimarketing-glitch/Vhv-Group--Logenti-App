import { getCurrentUser } from "@/lib/session";
import { getUserStatus } from "@/lib/user-status";
import { MessagesCenter } from "@/components/messages/MessagesCenter";

export default async function MessagesPage() {
  const user = await getCurrentUser();

  if (!user) {
    return <div className="panel">Necesitas iniciar sesion.</div>;
  }

  const status = getUserStatus(user);

  if (status === "TRAINEE") {
    return (
      <div className="panel">
        <div className="empty-state">
          <strong>Mensajes bloqueados por ahora.</strong>
          <p>Complete your training to unlock this feature.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="stack-lg">
      <section className="section-heading">
        <div>
          <p className="eyebrow">Mensajes internos</p>
          <h1>Centro de conversaciones</h1>
          <p className="section-copy">
            Aqui puedes revisar los mensajes que envies desde perfiles y continuar la conversacion.
          </p>
        </div>
      </section>

      <MessagesCenter
        user={{
          matricula: user.matricula,
          name: user.name,
          role: user.role,
          company: user.company,
          isMaster: user.isMaster,
          status,
        }}
      />
    </div>
  );
}
