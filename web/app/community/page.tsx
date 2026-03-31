import { getCurrentUser } from "@/lib/session";
import { NewsBoard } from "@/components/community/NewsBoard";
import { getUserStatus } from "@/lib/user-status";

export default async function CommunityPage() {
  const user = await getCurrentUser();

  if (!user) {
    return <div className="panel">Necesitas iniciar sesion.</div>;
  }

  const status = getUserStatus(user);

  return (
    <div className="stack-lg">
      <section className="section-heading">
        <div>
          <p className="eyebrow">Novedades y comunidad</p>
          <h1>Portal de avisos, blogs y videos</h1>
          <p className="section-copy">
            {user.role === "novato"
              ? "Bienvenido a novedades. Aqui recibiras avisos aprobados, mensajes importantes y el contenido de bienvenida que se publique para nuevos ingresos."
              : "Este espacio esta listo para publicar contenido real. No muestra datos falsos; solo lo que tu o un administrador agreguen."}
          </p>
        </div>
      </section>

      <NewsBoard
        user={{
          matricula: user.matricula,
          name: user.name,
          role: user.role,
          status,
          isMaster: user.isMaster,
        }}
      />
    </div>
  );
}
