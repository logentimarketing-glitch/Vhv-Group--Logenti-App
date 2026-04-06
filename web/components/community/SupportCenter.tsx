"use client";

import { useEffect, useMemo, useState } from "react";
import { PortalSupportThread, STORAGE_KEYS } from "@/lib/portal-seeds";

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
};

type MenuSection = "introduccion" | "curso" | "humano";

export function SupportCenter({ user }: SupportCenterProps) {
  const [threads, setThreads] = useState<PortalSupportThread[]>([]);
  const [message, setMessage] = useState("");
  const [lookupMatricula, setLookupMatricula] = useState(user.matricula);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [eligibleCourses, setEligibleCourses] = useState<Array<{ id: string; title: string; role: string }>>([]);
  const [helperReply, setHelperReply] = useState("");
  const [selectedMenu, setSelectedMenu] = useState<MenuSection>("introduccion");
  const [replyMap, setReplyMap] = useState<Record<string, string>>({});

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEYS.support);
    if (!raw) return;

    try {
      setThreads(JSON.parse(raw) as PortalSupportThread[]);
    } catch {}
  }, []);

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

    const isHumanRequest = currentMessage.toUpperCase() === "HUMANO";
    const result = await askBot({ message: currentMessage, action: "message" });
    const botReply = isHumanRequest
      ? "Tu solicitud fue enviada con Logenti. Una persona real revisara tu caso desde soporte tecnico."
      : result.reply;

    const nextThread: PortalSupportThread = {
      id: crypto.randomUUID(),
      senderMatricula: user.matricula,
      senderName: user.name,
      senderRole: user.role,
      question: currentMessage,
      botReply,
      quickAction,
      escalated: isHumanRequest || Boolean(result.escalated),
      status: isHumanRequest || result.escalated ? "Pendiente admin" : "Bot",
      createdAt: new Date().toISOString(),
    };

    save([nextThread, ...threads]);
    setMessage("");
    setHelperReply(botReply);
  }

  async function requestCourseKey() {
    if (!lookupMatricula.trim()) return;

    const result = await askBot({
      action: "course_key",
      matricula: lookupMatricula,
      courseId: selectedCourseId || undefined,
    });

    setEligibleCourses(result.eligibleCourses ?? []);
    setHelperReply(result.reply);

    const nextThread: PortalSupportThread = {
      id: crypto.randomUUID(),
      senderMatricula: user.matricula,
      senderName: user.name,
      senderRole: user.role,
      question: `CURSO: solicitud de clave para ${lookupMatricula}${selectedCourseId ? ` (${selectedCourseId})` : ""}`,
      botReply: result.reply,
      quickAction: "curso",
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
      thread.id === id
        ? {
            ...thread,
            adminReply,
            status: "Respondido" as const,
          }
        : thread,
    );

    save(next);
    setReplyMap((current) => ({ ...current, [id]: "" }));
  }

  const visibleThreads =
    user.role === "administrador"
      ? threads
      : threads.filter((thread) => thread.senderMatricula === user.matricula);

  const introCards = useMemo(
    () => [
      {
        title: "NOVEDADES",
        description: "Aqui ves publicaciones del equipo, anuncios y actividad interna.",
      },
      {
        title: "MI ESPACIO",
        description: "Aqui revisas tus cursos inscritos, avances y logros.",
      },
      {
        title: "CURSOS",
        description: "Aqui entras a clases, materiales y actividades autorizadas para tu perfil.",
      },
      {
        title: "PERFIL",
        description: "Aqui ves tu descripcion, tu foto y el muro de tus propias publicaciones.",
      },
      {
        title: "SOPORTE TECNICO",
        description: "Aqui usas el bot para resolver dudas o escribes HUMANO para escalar con Logenti.",
      },
    ],
    [],
  );

  if (user.role === "administrador") {
    return (
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Casos escalados</p>
            <h2>Bandeja de Logenti</h2>
            <p className="section-copy">
              Aqui llegan los casos donde una persona escribe HUMANO o necesita que una persona real intervenga.
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
                <div className="notes-box">
                  <strong>Bot</strong>
                  <p>{thread.botReply}</p>
                </div>
                {thread.adminReply ? (
                  <div className="notes-box">
                    <strong>Logenti</strong>
                    <p>{thread.adminReply}</p>
                  </div>
                ) : (
                  <div className="stack-sm">
                    <label className="field">
                      <span>Responder como Logenti</span>
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
                )}
              </article>
            ))
          ) : (
            <div className="empty-state">
              <strong>No hay casos escalados por ahora.</strong>
              <p>Cuando alguien escriba HUMANO, aparecera aqui.</p>
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
          <p className="eyebrow">Soporte tecnico</p>
          <h2>Asistente guiado</h2>
          <p className="section-copy">
            Si lo que buscas no se puede solucionar con el bot, escribe <strong>HUMANO</strong> para pasarte con una persona real y que pueda resolver tu problema.
          </p>
        </div>
      </div>

      <div className="member-feed-columns">
        <aside className="role-surface">
          <p className="role-section-label">Menu</p>
          <h2>Elige una ruta</h2>
          <div className="stack-sm">
            <button
              type="button"
              className={`role-mini-card ${selectedMenu === "introduccion" ? "social-post-card" : ""}`}
              onClick={() => setSelectedMenu("introduccion")}
            >
              <strong>INTRODUCCION</strong>
              <p>Explica cada apartado de la app y para que sirve.</p>
            </button>
            <button
              type="button"
              className={`role-mini-card ${selectedMenu === "curso" ? "social-post-card" : ""}`}
              onClick={() => setSelectedMenu("curso")}
            >
              <strong>CURSO</strong>
              <p>El bot analiza tus credenciales y te comparte claves de acceso segun tu perfil.</p>
            </button>
            <button
              type="button"
              className={`role-mini-card ${selectedMenu === "humano" ? "social-post-card" : ""}`}
              onClick={() => setSelectedMenu("humano")}
            >
              <strong>HUMANO</strong>
              <p>Escala tu caso directo con Logenti cuando una persona real deba intervenir.</p>
            </button>
          </div>

          {selectedMenu === "introduccion" ? (
            <div className="stack-sm">
              {introCards.map((card) => (
                <div key={card.title} className="role-mini-card">
                  <strong>{card.title}</strong>
                  <p>{card.description}</p>
                </div>
              ))}
            </div>
          ) : null}

          {selectedMenu === "curso" ? (
            <div className="role-mini-card">
              <strong>CURSO</strong>
              <p>Escribe tu matricula y el bot validara que claves de acceso puede compartirte.</p>
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
            </div>
          ) : null}

          {selectedMenu === "humano" ? (
            <div className="role-mini-card">
              <strong>HUMANO</strong>
              <p>Escribe exactamente HUMANO para que soporte tecnico te pase con Logenti.</p>
              <div className="hero-actions">
                <button
                  type="button"
                  className="primary-link action-button"
                  onClick={() => createThread("HUMANO", "humano")}
                >
                  Escalar con Logenti
                </button>
              </div>
            </div>
          ) : null}
        </aside>

        <section className="role-surface">
          <p className="role-section-label">Conversacion</p>
          <h2>Chat de soporte</h2>
          <div className="stack-sm">
            {visibleThreads.length ? (
              visibleThreads
                .slice()
                .reverse()
                .flatMap((thread) => [
                  <div key={`${thread.id}-user`} className="role-mini-card social-post-card">
                    <strong>{thread.senderName}</strong>
                    <p>{thread.question}</p>
                  </div>,
                  <div key={`${thread.id}-bot`} className="role-mini-card">
                    <strong>Soporte tecnico</strong>
                    <p>{thread.botReply}</p>
                  </div>,
                  thread.adminReply ? (
                    <div key={`${thread.id}-admin`} className="role-mini-card">
                      <strong>Logenti</strong>
                      <p>{thread.adminReply}</p>
                    </div>
                  ) : null,
                ])
            ) : (
              <div className="empty-state">
                <strong>Tu chat esta listo.</strong>
                <p>Empieza con una duda, escribe CURSO o manda HUMANO si necesitas una persona real.</p>
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
                placeholder="Ejemplo: CURSO, no puedo entrar a mi clase, o HUMANO"
              />
            </label>
            <div className="hero-actions">
              <button type="button" className="primary-link action-button" onClick={() => createThread()}>
                Enviar mensaje
              </button>
            </div>
            {helperReply ? <span className="pill">{helperReply}</span> : null}
          </div>
        </section>
      </div>
    </section>
  );
}
