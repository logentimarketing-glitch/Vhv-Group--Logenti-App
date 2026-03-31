import { NextResponse } from "next/server";
import { backendPost, hasBackendUrl } from "@/lib/backend-api";
import { resolveCourseKeyForUser } from "@/lib/course-eligibility";
import { supportFaq } from "@/lib/portal-seeds";

function resolveReply(message: string) {
  const content = message.toLowerCase();

  const matchingFaq = supportFaq.find((item) =>
    content.includes(item.question.toLowerCase().split(" ")[0]),
  );

  if (matchingFaq) {
    return {
      reply: matchingFaq.answer,
      escalated: false,
      faq: matchingFaq,
    };
  }

  if (content.includes("entrevista")) {
    return {
      reply:
        "Tu proceso puede pasar a entrevista en cuanto administracion confirme disponibilidad. Si necesitas seguimiento, dejo tu solicitud visible para el equipo.",
      escalated: true,
    };
  }

  if (content.includes("curso") || content.includes("clase") || content.includes("capacitacion")) {
    return {
      reply:
        "Puedo ayudarte a consultar tus cursos, revisar elegibilidad o recuperar la clave de acceso si tu matrícula ya está calificada.",
      escalated: false,
    };
  }

  if (
    content.includes("administrador") ||
    content.includes("reclutador") ||
    content.includes("humano") ||
    content.includes("urgente")
  ) {
    return {
      reply:
        "Tu mensaje requiere seguimiento humano. Lo puedo dejar marcado para que lo vea un administrador.",
      escalated: true,
    };
  }

  return {
    reply:
      "Puedo ayudarte con entrevistas, preguntas frecuentes, acceso a cursos, claves de grupo y seguimiento general dentro de la plataforma.",
    escalated: false,
  };
}

export async function POST(request: Request) {
  const payload = await request.json();
  const message = String(payload.message ?? "");
  const action = String(payload.action ?? "message");
  const matricula = String(payload.matricula ?? "");
  const courseId = payload.courseId ? String(payload.courseId) : undefined;

  if (hasBackendUrl()) {
    const backendResponse = await backendPost("/api/ai/chatbot", {
      message,
      action,
      matricula,
      courseId,
    });
    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  }

  if (action === "course_key") {
    const result = resolveCourseKeyForUser(matricula, courseId);

    return NextResponse.json({
      reply: result.message,
      escalated: false,
      eligibleCourses: result.eligibleCourses.map((course) => ({
        id: course.id,
        title: course.title,
        role: course.role,
      })),
      granted: result.ok && Boolean(result.course),
      course: result.course
        ? {
            id: result.course.id,
            title: result.course.title,
            accessCode: result.course.accessCode,
          }
        : null,
    });
  }

  return NextResponse.json(resolveReply(message));
}
