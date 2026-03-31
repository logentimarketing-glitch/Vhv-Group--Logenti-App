import { getCurrentUser } from "@/lib/session";
import { ProfileLookup } from "@/components/home/ProfileLookup";
import { getUserStatus } from "@/lib/user-status";

export default async function PersonProfilePage({
  params,
}: {
  params: { matricula: string };
}) {
  const user = await getCurrentUser();

  if (!user) {
    return <div className="panel">Necesitas iniciar sesion.</div>;
  }

  return (
    <ProfileLookup
      viewer={{
        matricula: user.matricula,
        role: user.role,
        company: user.company,
        status: getUserStatus(user),
      }}
      matricula={params.matricula}
    />
  );
}
