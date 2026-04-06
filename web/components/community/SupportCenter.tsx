"use client";

import { useEffect, useMemo, useState } from "react";
import { PortalSupportThread, STORAGE_KEYS } from "@/lib/portal-seeds";
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
};

type MenuOption = "introduccion" | "curso" | "humano";

type ChatLine = {
  id: string;
  sender: "bot" | "user" | "admin";
  author: string;
  text: string;
};

const supportMenu = [
  {
    id: "introduccion" as const,
    title: "INTRODUCCION",
    description:
      "Conoce que hace cada apartado del portal y como usar la plataforma desde tu perfil actual.",
  },
  {
    id: "curso" as const,
    title: "CURSO",
    description:
      "El bot revisa tus credenciales y te comparte las claves de acceso correctas para tus cursos segun tu perfil.",
  },
  {
    id: "humano" as const,
    title: "HUMANO",
    description:
      "Escala tu caso directo con Logenti. Si el bot no resuelve tu problema, escribe HUMANO y te pasamos con una persona real.",
  },
];

export function SupportCenter({ user }: SupportCenterProps) {
  const [threads, setThreads] = useState<PortalSupportThread[]>([]);
  const [message, setMessage] = useState("");
  const [replyMap, setReplyMap] = useState<Record<string, string>>({});
  const [lookupMatricula, setLookupMatricula] = useState(user.matricula);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [eligibleCourses, setEligibleCourses] = useState<Array<{ id: string; title: string; role: string }>>([]);
  const [helperReply, setHelperReply] = useState("");
  const [selectedMenu, setSelectedMenu] = useState<MenuOption>("introduccion");
  const status = getUserStatus(user);

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

    const forceHuman = currentMessage.toUpperCase() === "HUMANO";
    const result = await askBot({
      message: currentMessage,
      action: forceHuman ? "message" : "message",
    });

    const botReply = forceHuman
      ? "Tu solicitud fue escalada con Logenti. Un administrador real revisara tu caso desde soporte tecnico."
      : result.reply;

    const nextThread: PortalSupportThread = {
      id: crypto.randomUUID(),
      senderMatricula: user.matricula,
      senderName: user.name,
      senderRole: user.role,
      question: currentMessage,
      botReply,
      quickAction,
      escalated: forceHuman || Boolean(result.escalated),
      status: forceHuman || result.escalated ? "Pendiente admin" : "Bot",
      adminReply: undefined,
      createdAt: new Date().toISOString(),
    };

    save([nextThread, ...threads]);
    setMessage("");
    setHelperReply(botReply);
    if (forceHuman) {
      setSelectedMenu("humano");
    }
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
      question: `CURSO: solicitud de clave para matricula ${lookupMatricula}${selectedCourseId ? ` (${selectedCourseId})` : ""}`,
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
          author: "Logenti",
          text: thread.adminReply,
        });
      }

      return lines;
    });

  const introCards = useMemo(
    () => [
      {
        title: "NOVEDADES",
        description: "Aqui veras los posts del equipo, anuncios y publicaciones internas compartidas por otras personas.",
      },
      {
        title: "MI ESPACIO",
        description: "Aqui se concentra tu avance, tus cursos inscritos, progreso y logros dentro de la plataforma.",
      },
      {
        title: "CLASES / CURSOS",
        description: "Aqui entras a tus cursos, materiales y actividades segun tu perfil y las claves autorizadas.",
      },
      {
        title: "PERFIL",
        description: "Aqui ves tu descripcion, foto y tu propio muro con lo que has publicado.",
      },
      {
        title: "SOPORTE TECNICO",
        description: "Aqui resuelves dudas con el bot o escribes HUMANO para escalar con una persona real.",
      },
    ],
    [],
  );

  if (user.role === "administrador") {
    return (
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Bandeja humana</p>
            <h2>Solicitudes escaladas a Logenti</h2>
            <p className="section-copy">
              Aqui revisas los casos que llegan desde soporte tecnico cuando una persona escribe HUMANO o necesita ayuda real.
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
                    <strong>Logenti</strong>
                    <p>{thread.adminReply}</p>
                  </div>
                ) : null}
                {thread.status !== "Respondido" ? (
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
                ) : null}
              </article>
            ))
          ) : (
            <div className="empty-state">
              <strong>No hay casos pendientes.</strong>
              <p>Cuando alguien escriba HUMANO desde soporte tecnico, aparecera aqui.</p>
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
          <p className="eyebrow">Asistente guiado</p>
          <h2>Soporte tecnico</h2>
          <p className="section-copy">
            Si lo que buscas no se puede solucionar con el bot, escribe <strong>HUMANO</strong> para pasarte con una persona real y que pueda resolver tu problema.
          </p>
        </div>
      </div>

      <div className="member-feed-columns">
        <aside className="role-surface">
          <p className="role-section-label">Menu de ayuda</p>
          <h2>Elige como quieres usar soporte</h2>
          <div className="stack-sm">
            {supportMenu.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`role-mini-card ${selectedMenu === option.id ? "social-post-card" : ""}`}
                onClick={() => setSelectedMenu(option.id)}
              >
                <strong>{option.title}</strong>
                <p>{option.description}</p>
              </button>
            ))}
          </div>

          {selectedMenu === "introduccion" ? (
            <div className="stack-sm">
              <p className="role-section-label">Introduccion</p>
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
              <p>
                El bot analiza tu matricula, tu rol y tu perfil para compartirte solo las claves que te corresponden.
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
          ) : null}

          {selectedMenu === "humano" ? (
            <div className="role-mini-card">
              <strong>HUMANO</strong>
              <p>
                Escribe exactamente <strong>HUMANO</strong> y tu caso se enviara con Logenti para que una persona real lo atienda.
              </p>
              <div className="hero-actions">
                <button type="button" className="primary-link action-button" onClick={() => createThread("HUMANO", "humano")}>
                  Escalar con Logenti
                </button>
              </div>
            </div>
          ) : null}
        </aside>

        <section className="role-surface">
          <p className="role-section-label">Conversacion</p>
          <h2>Chat con soporte tecnico</h2>
          <p className="section-copy">
            Puedes preguntar por accesos, plataforma y cursos. Si el bot no resuelve, escribe HUMANO.
          </p>

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
                <p>Empieza con CURSO, una duda tecnica o escribe HUMANO para que te atienda Logenti.</p>
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
                placeholder="Ejemplo: CURSO, no puedo entrar a mi aula, o HUMANO"
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
