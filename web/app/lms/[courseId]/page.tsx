import { getCurrentUser } from "@/lib/session";
import { CourseAccess } from "@/components/lms/CourseAccess";

export default async function CoursePage({
  params,
}: {
  params: { courseId: string };
}) {
  const user = await getCurrentUser();

  if (!user) {
    return <div className="panel">Necesitas iniciar sesion.</div>;
  }

  return (
    <CourseAccess
      courseId={params.courseId}
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
