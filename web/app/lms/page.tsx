import { getCurrentUser } from "@/lib/session";
import { LmsHub } from "@/components/lms/LmsHub";

export default async function LMSPage() {
  const user = await getCurrentUser();

  if (!user) {
    return <div className="panel">Necesitas iniciar sesion.</div>;
  }

  return (
    <LmsHub
      user={{
        matricula: user.matricula,
        role: user.role,
        status: user.status,
        company: user.company,
        position: user.position,
        isMaster: user.isMaster,
      }}
    />
  );
}
