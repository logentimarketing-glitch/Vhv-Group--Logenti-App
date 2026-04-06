import { NotificationsCenter } from "@/components/notifications/NotificationsCenter";
import { getCurrentUser } from "@/lib/session";
import { getUserStatus } from "@/lib/user-status";

export default async function NotificationsPage() {
  const user = await getCurrentUser();

  if (!user) {
    return <div className="panel">Necesitas iniciar sesion.</div>;
  }

  return (
    <NotificationsCenter
      user={{
        matricula: user.matricula,
        name: user.name,
        role: user.role,
        status: getUserStatus(user),
      }}
    />
  );
}
