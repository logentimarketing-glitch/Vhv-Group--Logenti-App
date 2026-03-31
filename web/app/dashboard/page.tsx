import { getCurrentUser } from "@/lib/session";
import { AdminPortal } from "@/components/dashboard/AdminPortal";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "administrador") {
    return <div className="panel">Necesitas iniciar sesion.</div>;
  }

  return (
    <div className="role-experience role-experience-admin stack-lg">
      <section className="section-heading admin-heading">
        <div>
          <p className="eyebrow admin-eyebrow">Panel administrador</p>
          <h1>{user.isMaster ? "Centro de control maestro" : "Panel administrativo"}</h1>
          <p className="section-copy admin-copy">
            {user.isMaster
              ? "Esta vista centraliza reclutamiento, niveles, capacitacion, captacion y supervision general del corporativo."
              : "Esta vista concentra reclutamiento, seguimiento, personas, cursos y canales internos con una estructura estable para todo el personal administrativo."}
          </p>
        </div>
      </section>

      <AdminPortal
        user={{
          matricula: user.matricula,
          name: user.name,
          position: user.position,
          isMaster: user.isMaster,
        }}
      />
    </div>
  );
}
