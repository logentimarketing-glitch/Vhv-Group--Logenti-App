"use client";

import { useEffect, useMemo, useState } from "react";
import {
  canAdminDeleteMessage,
  deleteConversationForUser,
  deleteDirectMessage,
  getMessageSuggestions,
  getMessageThreadsForUser,
  sendDirectMessage,
} from "@/lib/messages";
import { PortalMember } from "@/lib/portal-seeds";

type MessagesCenterProps = {
  user: {
    matricula: string;
    name: string;
    role: "administrador" | "novato" | "usuario";
    company?: string;
    isMaster?: boolean;
    status?: "TRAINEE" | "ACTIVE_EMPLOYEE" | "ADMIN";
  };
};

type MessageThread = ReturnType<typeof getMessageThreadsForUser>[number];
type SuggestionTabs = "administracion" | "usuarios" | "novatos";

export function MessagesCenter({ user }: MessagesCenterProps) {
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState("");
  const [draft, setDraft] = useState("");
  const [suggestionTab, setSuggestionTab] = useState<SuggestionTabs>("administracion");
  const [search, setSearch] = useState("");

  function refreshThreads() {
    const next = getMessageThreadsForUser(user.matricula);
    setThreads(next);

    if (selectedParticipant && next.some((thread) => thread.participantMatricula === selectedParticipant)) {
      return;
    }

    if (next[0]) {
      setSelectedParticipant(next[0].participantMatricula);
    }
  }

  useEffect(() => {
    refreshThreads();
  }, [user.matricula]);

  const suggestions = useMemo(() => getMessageSuggestions(user), [user]);

  const filteredSuggestions = useMemo(() => {
    const list = suggestions[suggestionTab];
    if (!search.trim()) return list;

    return list.filter((member) =>
      `${member.name} ${member.position} ${member.company}`.toLowerCase().includes(search.toLowerCase()),
    );
  }, [search, suggestionTab, suggestions]);

  const selectedThread = useMemo(
    () => threads.find((thread) => thread.participantMatricula === selectedParticipant) ?? null,
    [selectedParticipant, threads],
  );

  const selectedSuggestion = useMemo(
    () =>
      filteredSuggestions.find((member) => member.matricula === selectedParticipant) ??
      suggestions.administracion.find((member) => member.matricula === selectedParticipant) ??
      suggestions.usuarios.find((member) => member.matricula === selectedParticipant) ??
      suggestions.novatos.find((member) => member.matricula === selectedParticipant) ??
      null,
    [filteredSuggestions, selectedParticipant, suggestions],
  );

  const activeParticipant = selectedThread
    ? {
        matricula: selectedThread.participantMatricula,
        name: selectedThread.participantName,
      }
    : selectedSuggestion
      ? {
          matricula: selectedSuggestion.matricula,
          name: selectedSuggestion.name,
        }
      : null;

  function openSuggestion(member: PortalMember) {
    setSelectedParticipant(member.matricula);
    setDraft("");
  }

  function handleDeleteConversation() {
    if (!activeParticipant) return;
    deleteConversationForUser(user.matricula, activeParticipant.matricula);
    setSelectedParticipant("");
    refreshThreads();
  }

  function handleSendReply() {
    if (!activeParticipant || !draft.trim()) return;

    sendDirectMessage({
      from: user.matricula,
      to: activeParticipant.matricula,
      fromName: user.name,
      toName: activeParticipant.name,
      content: draft,
    });

    setDraft("");
    refreshThreads();
    setSelectedParticipant(activeParticipant.matricula);
  }

  function handleDeleteMessage(messageId: string) {
    deleteDirectMessage(messageId);
    refreshThreads();
  }

  const threadList = threads.length ? (
    <div className="messages-thread-list">
      {threads.map((thread) => {
        const lastMessage = thread.messages[thread.messages.length - 1];
        const active = thread.participantMatricula === selectedParticipant;

        return (
          <button
            key={thread.participantMatricula}
            type="button"
            className={`message-thread-item ${active ? "active" : ""}`}
            onClick={() => setSelectedParticipant(thread.participantMatricula)}
          >
            <div className="message-thread-avatar">{thread.participantName.slice(0, 1)}</div>
            <div className="message-thread-copy">
              <strong>{thread.participantName}</strong>
              <p>{lastMessage?.content ?? "Sin mensajes todavia."}</p>
            </div>
          </button>
        );
      })}
    </div>
  ) : (
    <div className="messages-suggestions">
      <div className="messages-tab-row">
        <button
          type="button"
          className={`admin-filter-chip ${suggestionTab === "administracion" ? "active" : ""}`}
          onClick={() => setSuggestionTab("administracion")}
        >
          Administracion
        </button>
        <button
          type="button"
          className={`admin-filter-chip ${suggestionTab === "usuarios" ? "active" : ""}`}
          onClick={() => setSuggestionTab("usuarios")}
        >
          Usuarios
        </button>
        <button
          type="button"
          className={`admin-filter-chip ${suggestionTab === "novatos" ? "active" : ""}`}
          onClick={() => setSuggestionTab("novatos")}
        >
          Novatos
        </button>
      </div>

      <label className="field search-field">
        <span>Sugerencias</span>
        <div className="search-input-wrap">
          <span className="search-icon">⌕</span>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Busca una persona"
          />
        </div>
      </label>

      {filteredSuggestions.length ? (
        <div className="messages-thread-list">
          {filteredSuggestions.map((member) => (
            <button
              key={member.matricula}
              type="button"
              className={`message-thread-item ${selectedParticipant === member.matricula ? "active" : ""}`}
              onClick={() => openSuggestion(member)}
            >
              <div className="message-thread-avatar">{member.name.slice(0, 1)}</div>
              <div className="message-thread-copy">
                <strong>{member.name}</strong>
                <p>{member.position}</p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <strong>No hay sugerencias en esta pestaña.</strong>
          <p>Cambia de grupo o espera a que existan mas personas visibles para tu perfil.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="messages-shell">
      <aside className="panel messages-left-rail">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Chats</p>
            <h2>{threads.length ? "Tus conversaciones" : "Sugerencias para iniciar chat"}</h2>
          </div>
        </div>
        {threadList}
      </aside>

      <section className="panel messages-right-stage">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Conversacion</p>
            <h2>{activeParticipant?.name ?? "Selecciona un chat"}</h2>
            <p className="section-copy">
              {activeParticipant
                ? "Aqui puedes continuar la conversacion y mantener historial guardado."
                : "Elige una conversacion existente o una sugerencia para empezar a chatear."}
            </p>
          </div>
          {activeParticipant ? (
            <div className="hero-actions">
              <button type="button" className="secondary-link action-button" onClick={handleDeleteConversation}>
                Borrar chat
              </button>
            </div>
          ) : null}
        </div>

        {activeParticipant ? (
          <div className="messages-stage-content">
            <div className="messages-conversation messages-scroll">
              {selectedThread?.messages.length ? (
                selectedThread.messages.map((message) => (
                  <div
                    key={message.id}
                    className={`message-bubble ${message.from === user.matricula ? "outgoing" : "incoming"}`}
                  >
                    <span>{message.from === user.matricula ? "Tu" : activeParticipant.name}</span>
                    <p>{message.content}</p>
                    {canAdminDeleteMessage(user, message) ? (
                      <div className="hero-actions">
                        <button
                          type="button"
                          className="secondary-link action-button"
                          onClick={() => handleDeleteMessage(message.id)}
                        >
                          Borrar mensaje
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <strong>Esta conversacion aun no tiene mensajes.</strong>
                  <p>Escribe el primero y quedara guardado automaticamente.</p>
                </div>
              )}
            </div>

            <div className="messages-composer">
              <label className="field">
                <span>Mensaje</span>
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  rows={4}
                  placeholder="Escribe aqui tu mensaje"
                />
              </label>
              <div className="hero-actions">
                <button type="button" className="primary-link action-button" onClick={handleSendReply}>
                  Enviar
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="empty-state messages-empty-stage">
            <strong>Tu espacio de mensajes esta listo.</strong>
            <p>Abre una conversacion desde la lista izquierda o elige una sugerencia.</p>
          </div>
        )}
      </section>
    </div>
  );
}
