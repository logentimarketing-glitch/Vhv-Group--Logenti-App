"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getUserConnections, readConnections, toggleConnection, areUsersConnected } from "@/lib/connections";
import { canMessageMember, sendDirectMessage } from "@/lib/messages";
import { readMemberDirectory } from "@/lib/personal-search";
import { PortalConnection, PortalMember, PortalNews, STORAGE_KEYS } from "@/lib/portal-seeds";
import { getStatusLabel, getUserStatus } from "@/lib/user-status";
import { getProfileStorageKey, readProfileRegistry, resolveStoredProfile, type StoredProfile } from "@/lib/profile";
import { readStorage } from "@/lib/storage";
import { readNews, writeNews } from "@/lib/news";
import { isImageLikeUrl, normalizeMediaUrl } from "@/lib/media-links";

type ProfileViewerProps = {
  viewer: {
    matricula: string;
    role: "administrador" | "novato" | "usuario";
    status?: "TRAINEE" | "ACTIVE_EMPLOYEE" | "ADMIN";
  };
  person: PortalMember;
};

export function ProfileViewer({ viewer, person }: ProfileViewerProps) {
  const [connections, setConnections] = useState<PortalConnection[]>([]);
  const [connectedMembers, setConnectedMembers] = useState<PortalMember[]>([]);
  const [message, setMessage] = useState("");
  const [messageSent, setMessageSent] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [bio, setBio] = useState("");
  const [posts, setPosts] = useState<PortalNews[]>([]);
  const viewerStatus = getUserStatus(viewer);
  const personStatus = getUserStatus(person);
  const isDemoBot = Boolean(person.isDemoBot);
  const canInteract = true;
  const canConnect = !isDemoBot && viewerStatus !== "TRAINEE" && canInteract && viewer.matricula !== person.matricula;
  const canMessage = !isDemoBot && canMessageMember(viewer, person);
  const canReactToPosts = !isDemoBot && (viewerStatus !== "ADMIN" ? personStatus !== "TRAINEE" : true);

  useEffect(() => {
    const currentConnections = readConnections();
    setConnections(currentConnections);
    setConnectedMembers(
      getUserConnections(person.matricula, readMemberDirectory(), currentConnections),
    );
  }, [person.matricula, viewer.matricula]);

  useEffect(() => {
    const registry = readProfileRegistry();
    const stored =
      registry[person.matricula] ??
      readStorage<StoredProfile | null>(getProfileStorageKey(person.matricula), null);
    const profile = resolveStoredProfile(
      {
        matricula: person.matricula,
        role: person.role,
        name: person.name,
        email: person.email,
        position: person.position,
        company: person.company,
      },
      stored,
    );
    setPhotoUrl(profile.photoUrl);
    setBio(profile.bio);
  }, [person]);

  useEffect(() => {
    setPosts(
      readNews().filter(
        (item) => item.authorMatricula === person.matricula && item.status === "aprobado",
      ),
    );
  }, [person.matricula]);

  function handleToggleConnection() {
    const next = toggleConnection(
      connections,
      viewer.matricula,
      person.matricula,
      viewer.matricula,
    );
    setConnections(next);
    window.localStorage.setItem(STORAGE_KEYS.connections, JSON.stringify(next));
    setConnectedMembers(getUserConnections(person.matricula, readMemberDirectory(), next));
  }

  function sendMessage() {
    if (!canMessage) {
      setMessageSent("Solo puedes escribir a personal administrativo o personas de tu misma empresa.");
      return;
    }
    if (!message.trim()) return;
    const viewerMember = readMemberDirectory().find(
      (member) => member.matricula === viewer.matricula,
    );

    sendDirectMessage({
      from: viewer.matricula,
      to: person.matricula,
      fromName: viewerMember?.name ?? viewer.matricula,
      toName: person.name,
      content: message.trim(),
    });
    setMessage("");
    setMessageSent("Mensaje guardado en tu bandeja.");
  }

  function toggleStar(postId: string) {
    const next = readNews().map((item) =>
      item.id === postId
        ? {
            ...item,
            starredBy: item.starredBy.includes(viewer.matricula)
              ? item.starredBy.filter((matricula) => matricula !== viewer.matricula)
              : [...item.starredBy, viewer.matricula],
          }
        : item,
    );

    writeNews(next);
    setPosts(next.filter((item) => item.authorMatricula === person.matricula && item.status === "aprobado"));
  }

  const isConnected = areUsersConnected(connections, viewer.matricula, person.matricula);

  return (
    <div className="member-feed-layout">
      <section className="facebook-profile-shell">
        <div className="facebook-cover" />
        <div className="facebook-profile-head">
          <div className="facebook-avatar large">
            {photoUrl ? <img src={photoUrl} alt={person.name} /> : <span>{person.name.slice(0, 1)}</span>}
          </div>
          <div className="facebook-profile-copy">
            {isDemoBot ? (
              <span className="pill warning">BOT</span>
            ) : personStatus === "ADMIN" ? (
              <span className="admin-badge">ADMIN STAFF</span>
            ) : (
              <span
                className={`status-pill ${
                  personStatus === "ACTIVE_EMPLOYEE" ? "status-pill-active" : "status-pill-trainee"
                }`}
              >
                {getStatusLabel(personStatus)}
              </span>
            )}
            <h1>{person.name}</h1>
            <p>{person.position}</p>
            {person.company ? <span>{person.company}</span> : null}
          </div>
        </div>
      </section>

      <div className="member-feed-columns">
        <article className="role-surface">
          <div className="stack-sm">
            <div className="role-mini-card">
              <strong>Rango</strong>
              <p>{isDemoBot ? "Bot demo interno" : getStatusLabel(personStatus)}</p>
              {viewerStatus === "ADMIN" ? <span>{person.matricula}</span> : null}
            </div>
            {person.company ? (
              <div className="role-mini-card">
                <strong>Empresa</strong>
                <span>{person.company}</span>
              </div>
            ) : null}
            <div className="role-mini-card">
              <strong>Descripcion</strong>
              <p>
                {bio ||
                  (isDemoBot
                    ? "Perfil bot de demostracion para pruebas internas."
                    : "Esta persona aun no ha agregado una descripcion en su perfil.")}
              </p>
            </div>
          </div>
        </article>

        <article className="role-surface">
          <div className="stack-sm">
            {isDemoBot ? (
              <span className="pill subtle">Perfil bot solo visible para administracion</span>
            ) : canConnect ? (
              <div className="hero-actions">
                <button type="button" className="primary-link action-button" onClick={handleToggleConnection}>
                  {isConnected ? "Quitar colega" : "Agregar colega"}
                </button>
              </div>
            ) : viewer.role === "novato" ? (
              <span className="pill subtle">Modo novato: solo consulta</span>
            ) : (
              <span className="pill subtle">Perfil propio</span>
            )}

            {canInteract && canMessage ? (
              <>
                <label className="field">
                  <span>Enviar mensaje</span>
                  <textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={4} />
                </label>
                <div className="hero-actions">
                  <button type="button" className="secondary-link action-button" onClick={sendMessage}>
                    Enviar mensaje
                  </button>
                  <Link href="/messages" className="primary-link">
                    Abrir mensajes
                  </Link>
                </div>
                {messageSent ? <span className="pill">{messageSent}</span> : null}
              </>
            ) : (
              <div className="role-mini-card">
                <strong>Mensajes restringidos</strong>
                <p>
                  {isDemoBot
                    ? "Los perfiles bot no admiten mensajes ni conexiones."
                    : "Solo puedes escribir a personal administrativo o a personas de tu misma empresa."}
                </p>
              </div>
            )}

            <div className="role-mini-card">
              <strong>Conexiones</strong>
              {isDemoBot ? (
                <p>Los bots demo no participan en conexiones.</p>
              ) : connectedMembers.length ? (
                <div className="stack-sm">
                  {connectedMembers.map((connection) => (
                    <Link
                      key={connection.matricula}
                      href={`/profiles/${connection.matricula}`}
                      className="secondary-link"
                    >
                      {connection.name}
                    </Link>
                  ))}
                </div>
              ) : (
                <p>Aun no hay colegas conectados.</p>
              )}
            </div>
          </div>
        </article>
      </div>

      <section className="role-surface">
        <p className="role-section-label">Publicaciones</p>
        <h2>Muro visible</h2>
        <div className="stack-sm">
          {posts.length ? (
            posts.map((post) => (
              <article key={post.id} className="social-card">
                <strong>{post.title}</strong>
                <p>{post.summary}</p>
                {post.imageUrl && isImageLikeUrl(post.imageUrl) ? (
                  <img src={normalizeMediaUrl(post.imageUrl)} alt={post.title} className="post-image" />
                ) : null}
                <div className="hero-actions">
                  <span className="pill subtle">{post.comments.length} comentarios</span>
                  {canReactToPosts ? (
                    <button type="button" className="secondary-link action-button" onClick={() => toggleStar(post.id)}>
                      ★ {post.starredBy.length}
                    </button>
                  ) : null}
                </div>
              </article>
            ))
          ) : (
            <div className="empty-state">
              <strong>{isDemoBot ? "Este bot no publica contenido social." : "Este perfil aun no tiene publicaciones publicas."}</strong>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
