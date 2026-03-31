import { getCurrentUser } from "@/lib/session";
import { getAdminPermissions } from "@/lib/admin-permissions";
import { PipelineBoard } from "@/components/dashboard/PipelineBoard";

type PipelinePageProps = {
  searchParams?: Promise<{ candidate?: string }>;
};

export default async function PipelinePage({ searchParams }: PipelinePageProps) {
  const user = await getCurrentUser();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  if (!user || user.role !== "administrador") {
    return <div className="panel">Necesitas iniciar sesion.</div>;
  }

  const permissions = getAdminPermissions(user);

  if (!permissions.canManageCandidates) {
    return (
      <div className="panel">
        <div className="empty-state admin-empty-state">
          <strong>Tu puesto no tiene acceso al pipeline.</strong>
          <p>El embudo de candidatos solo esta habilitado para reclutamiento, liderazgo operativo autorizado y la cuenta master.</p>
        </div>
      </div>
    );
  }

  return <PipelineBoard initialCandidateId={resolvedSearchParams?.candidate} />;
}
