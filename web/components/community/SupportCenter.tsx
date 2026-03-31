"use client";

import { useEffect, useMemo, useState } from "react";
import { supportFaq, PortalSupportThread, STORAGE_KEYS } from "@/lib/portal-seeds";
import { getUserStatus } from "@/lib/user-status";

type SupportCenterProps = {
  user: {
    matricula: string;
    name: string;
    role: "administrador" | "novato" | "usuario";
    status?: "TRAINEE" | "ACTIVE_EMPLOYEE" | "ADMIN";
  };
};

type ChatbotResponse = {
  reply: string;
  escalated?: boolean;
  eligibleCourses?: { id: string; title: string; role: string }[];
  granted?: boolean;
  course?: { id: string; title: string; accessCode: string } | null;
};

const quickActions = [
  { id: "faq-course", label: "Clave de grupo", type: "course_key" },
  { id: "faq-docs", label: "Documentos", type: "message", prompt: "Que documentos internos necesito para mi alta y seguimiento" },
  { id: "faq-human", label: "Hablar con admin", type: "message", prompt: "Necesito hablar con una persona de administracion" },
] as const;

type ChatLine = {
  id: string;
  sender: "bot" | "user" | "admin";
  author: string;
  text: string;
};

export function SupportCenter({ user }: SupportCenterProps) {
  const [threads, setThreads] = useState<PortalSupportThread[]>([]);
  const [message, setMessage] = useState("");
  const [replyMap, setReplyMap] = useState<Record<string, string>>({});
  const [lookupMatricula, setLookupMatricula] = useState(user.matricula);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [eligibleCourses, setEligibleCourses] = useState<Array<{ id: string; title: string; role: string }>>([]);
  const [helperReply, setHelperReply] = useState("");
  const status = getUserStatus(user);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEYS.support);
    if (!raw) return;

    try {
      setThreads(JSON.parse(raw) as PortalSupportThread[]);
    } catch {}
  }, []);

  const quickFaq = useMemo(() => supportFaq.slice(0, 5), []);

  function save(next: PortalSupportThread[]) {
    setThreads(next);
    window.localStorage.setItem(STORAGE_KEYS.support, JSON.stringify(next));
  }

  async function askBot(payload: Record<string, unknown>) {
    const response = await fetch("/api/ai/chatbot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return (await response.json()) as ChatbotResponse;
  }

  async function createThread(nextMessage?: string, quickAction?: string) {
    const currentMessage = String(nextMessage ?? message).trim();
    if (!currentMessage) return;

    const result = await askBot({ message: currentMessage, action: "message" });

    const nextThread: PortalSupportThread = {
      id: crypto.randomUUID(),
      senderMatricula: user.matricula,
      senderName: user.name,
      senderRole: user.role,
      question: currentMessage,
      botReply: result.reply,
      quickAction,
      escalated: Boolean(result.escalated),
      status: result.escalated ? "Pendiente admin" : "Bot",
      createdAt: new Date().toISOString(),
    };

    save([nextThread, ...threads]);
    setMessage("");
    setHelperReply(result.reply);
  }

  async function requestCourseKey() {
    if (!lookupMatricula.trim()) return;

    const result = await askBot({
      action: "course_key",
      matricula: lookupMatricula,
      courseId: selectedCourseId || undefined,
    });

    setHelperReply(result.reply);
    setEligibleCourses(result.eligibleCourses ?? []);

    const nextThread: PortalSupportThread = {
      id: crypto.randomUUID(),
      senderMatricula: user.matricula,
      senderName: user.name,
      senderRole: user.role,
      question: `Solicitud de clave de grupo para matricula ${lookupMatricula}${selectedCourseId ? ` (${selectedCourseId})` : ""}`,
      botReply: result.reply,
      quickAction: "course_key",
      escalated: false,
      status: "Bot",
      createdAt: new Date().toISOString(),
    };

    save([nextThread, ...threads]);
  }

  function answerThread(id: string) {
    const adminReply = replyMap[id]?.trim();
    if (!adminReply) return;

    const next = threads.map((thread) =>
      thread.id === id ? { ...thread, adminReply, status: "Respondido" as const } : thread,
    );
    save(next);
    setReplyMap((current) => ({ ...current, [id]: "" }));
  }

  const visibleThreads =
    user.role === "administrador"
      ? threads
      : threads.filter((thread) => thread.senderMatricula === user.matricula);

  const chatLines: ChatLine[] = visibleThreads
    .slice()
    .reverse()
    .flatMap((thread) => {
      const lines: ChatLine[] = [
        {
          id: `${thread.id}-q`,
          sender: "user",
          author: thread.senderName,
          text: thread.question,
        },
        {
          id: `${thread.id}-b`,
          sender: "bot",
          author: "Soporte tecnico",
          text: thread.botReply,
        },
      ];

      if (thread.adminReply) {
        lines.push({
          id: `${thread.id}-a`,
          sender: "admin",
          author: "Administrador",
          text: thread.adminReply,
        });
      }

      return lines;
    });

  if (user.role === "administrador") {
    return (
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Bandeja de soporte</p>
            <h2>Conversaciones escaladas</h2>
            <p className="section-copy">
              Aqui revisas dudas escaladas, solicitudes de claves y conversaciones que necesitan respuesta humana.
            </p>
          </div>
        </div>

        <div className="stack-sm">
          {visibleThreads.length ? (
            visibleThreads.map((thread) => (
              <article key={thread.id} className="role-mini-card">
                <strong>{thread.senderName}</strong>
                <p>{thread.question}</p>
                <span>{thread.status}</span>
                {thread.quickAction ? <span className="pill">{thread.quickAction}</span> : null}
                <div className="notes-box">
                  <strong>Bot</strong>
                  <p>{thread.botReply}</p>
                </div>
                {thread.adminReply ? (
                  <div className="notes-box">
                    <strong>Administrador</strong>
                    <p>{thread.adminReply}</p>
                  </div>
                ) : null}
                {thread.status !== "Respondido" ? (
                  <div className="stack-sm">
                    <label className="field">
                      <span>Responder</span>
                      <textarea
                        value={replyMap[thread.id] ?? ""}
                        onChange={(event) =>
                          setReplyMap((current) => ({ ...current, [thread.id]: event.target.value }))
                        }
                        rows={3}
                      />
                    </label>
                    <div className="hero-actions">
                      <button
                        type="button"
                        className="secondary-link action-button"
                        onClick={() => answerThread(thread.id)}
                      >
                        Enviar respuesta
                      </button>
                    </div>
                  </div>
                ) : null}
              </article>
            ))
          ) : (
            <div className="empty-state">
              <strong>Aun no hay conversaciones.</strong>
              <p>Cuando el bot escale dudas o lleguen solicitudes apareceran aqui.</p>
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Soporte tecnico interno</p>
          <h2>Soporte tecnico</h2>
          <p className="section-copy">
            {status === "TRAINEE"
              ? "Este soporte tecnico te acompana en tus primeros dias, te orienta sobre cursos asignados y puede compartir las claves de acceso correctas segun tu perfil."
              : "Aqui tienes a tu disposicion soporte tecnico para dudas generales, seguimiento y claves de cursos. Si tu caso necesita atencion humana, el sistema lo escala con administracion."}
          </p>
        </div>
      </div>

      <div className="member-feed-columns">
        <aside className="role-surface">
          <p className="role-section-label">Preguntas frecuentes</p>
          <h2>Respuestas rapidas</h2>
          <div className="stack-sm">
            {quickFaq.map((item) => (
              <div key={item.id} className="role-mini-card">
                <strong>{item.question}</strong>
                <p>{item.answer}</p>
              </div>
            ))}
          </div>

          <div className="stack-sm">
            <p className="role-section-label">Acciones rapidas</p>
            <div className="hero-actions">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  className="admin-filter-chip"
                  onClick={() =>
                    action.type === "course_key"
                      ? setHelperReply("Ingresa tu matricula y te dire si tienes acceso a una clave.")
                      : createThread(action.prompt, action.id)
                  }
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>

          <div className="role-mini-card">
            <strong>Clave de grupo</strong>
            <p>
              Escribe tu matricula y, si tu perfil esta calificado para la clase correcta,
              el bot te compartira la clave.
            </p>
            <div className="form-grid">
              <label className="field">
                <span>Matricula</span>
                <input value={lookupMatricula} onChange={(event) => setLookupMatricula(event.target.value)} />
              </label>
              <label className="field">
                <span>Curso especifico opcional</span>
                <select
                  className="field-select"
                  value={selectedCourseId}
                  onChange={(event) => setSelectedCourseId(event.target.value)}
                >
                  <option value="">Que el bot elija por mi perfil</option>
                  {eligibleCourses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="hero-actions">
              <button type="button" className="primary-link action-button" onClick={requestCourseKey}>
                Consultar clave
              </button>
            </div>
            {helperReply ? <p className="section-copy">{helperReply}</p> : null}
          </div>
        </aside>

        <section className="role-surface">
          <p className="role-section-label">Conversacion</p>
          <h2>Chat en vivo con soporte tecnico</h2>

          <div className="stack-sm">
            {chatLines.length ? (
              chatLines.map((line) => (
                <div
                  key={line.id}
                  className={`role-mini-card ${line.sender === "user" ? "social-post-card" : ""}`}
                >
                  <strong>{line.author}</strong>
                  <p>{line.text}</p>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <strong>Tu chat esta listo.</strong>
                <p>Escribe tu primera duda y el bot te respondera aqui mismo.</p>
              </div>
            )}
          </div>

          <div className="stack-sm">
            <label className="field">
              <span>Escribe tu mensaje</span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={4}
                placeholder="Ejemplo: no puedo entrar a mi curso o necesito hablar con administracion"
              />
            </label>
            <div className="hero-actions">
              <button type="button" className="primary-link action-button" onClick={() => createThread()}>
                Enviar mensaje
              </button>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
