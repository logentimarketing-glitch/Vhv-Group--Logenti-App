"use client";

import { useEffect, useMemo, useState } from "react";
import { PortalNews } from "@/lib/portal-seeds";
import {
  dispatchCloudSync,
  dispatchNewsUpdated,
} from "@/lib/cloud-sync";
import {
  addModerationNotification,
  clearModerationNotification,
  getPendingNewsCount,
  readNews,
  writeNews,
} from "@/lib/news";
import { addNotification } from "@/lib/notifications";
import { getUserStatus } from "@/lib/user-status";
import { isImageLikeUrl, normalizeMediaUrl } from "@/lib/media-links";

type NewsBoardProps = {
  user: {
    matricula: string;
    name: string;
    role: "administrador" | "novato" | "usuario";
    status?: "TRAINEE" | "ACTIVE_EMPLOYEE" | "ADMIN";
    isMaster?: boolean;
  };
};

type FeedFilter = "todo" | "mio" | "pendiente";

type BasePostPayload = {
  title: string;
  type: string;
  summary: string;
  imageUrl?: string;
  imageName?: string;
  repostOfId?: string;
  repostPreview?: PortalNews["repostPreview"];
};

function getWelcomeMessage(user: NewsBoardProps["user"]) {
  if (user.isMaster) {
    return {
      title: "Bienvenida, Logenti",
      copy:
        "Aqui veras primero las publicaciones pendientes, los avisos aprobados y la actividad general del ecosistema para ordenar y moderar la comunicacion interna.",
    };
  }

  if (user.role === "administrador") {
    return {
      title: `Bienvenida, ${user.name}`,
      copy:
        "Este es tu feed interno. Desde aqui puedes compartir contenido, reaccionar, comentar y seguir el pulso de la comunidad del corporativo.",
    };
  }

  if (user.role === "novato") {
    return {
      title: `Bienvenido, ${user.name}`,
      copy:
        "Aqui veras solo publicaciones aprobadas, avisos importantes y el contenido de bienvenida que el equipo comparta contigo.",
    };
  }

  return {
    title: `Bienvenido, ${user.name}`,
    copy:
      "Este es tu feed social interno. Aqui encontraras comunicados, publicaciones del equipo, reposts y contenido profesional.",
  };
}

export function NewsBoard({ user }: NewsBoardProps) {
  const [items, setItems] = useState<PortalNews[]>([]);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Post");
  const [summary, setSummary] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FeedFilter>("todo");
  const [commentMap, setCommentMap] = useState<Record<string, string>>({});
  const [rejectionReasonMap, setRejectionReasonMap] = useState<Record<string, string>>({});
  const [repostNoteMap, setRepostNoteMap] = useState<Record<string, string>>({});

  const welcome = useMemo(() => getWelcomeMessage(user), [user]);
  const status = getUserStatus(user);
  const canPublish = status !== "TRAINEE";
  const canInteractWithPosts = status !== "TRAINEE";
  const pendingCount = getPendingNewsCount(items);
  const lockedMessage = "Complete your training to unlock this feature";
  const lockIcon = "\uD83D\uDD12";
  const searchIcon = "\u2315";

  useEffect(() => {
    setItems(readNews());
  }, []);

  function save(next: PortalNews[]) {
    setItems(next);
    writeNews(next);
    dispatchNewsUpdated();
    dispatchCloudSync();
  }

  function buildBasePost(payload: BasePostPayload): PortalNews {
    return {
      id: crypto.randomUUID(),
      authorRole: user.role,
      authorMatricula: user.matricula,
      authorName: user.name,
      status: user.isMaster ? "aprobado" : "pendiente",
      submittedAt: new Date().toISOString(),
      approvedAt: user.isMaster ? new Date().toISOString() : undefined,
      approvedByMatricula: user.isMaster ? user.matricula : undefined,
      approvedByName: user.isMaster ? user.name : undefined,
      starredBy: [],
      comments: [],
      createdAt: new Date().toISOString(),
      ...payload,
    };
  }

  function createItem() {
    if (!canPublish || !title.trim() || !summary.trim()) return;

    const nextItem: PortalNews = buildBasePost({
      title: title.trim(),
      type: type.trim(),
      summary: summary.trim(),
      imageUrl: normalizeMediaUrl(imageUrl) || undefined,
      imageName: undefined,
    });

    save([nextItem, ...items]);
    if (!user.isMaster) {
      addModerationNotification(nextItem.title);
    } else {
      addNotification({
        kind: "info",
        priority: "high",
        title: "Nuevo aviso de Logenti",
        message: `${nextItem.title} ya esta disponible para todo el equipo.`,
      });
    }
    setTitle("");
    setType("Post");
    setSummary("");
    setImageUrl("");
  }

  function repostItem(item: PortalNews) {
    if (!canPublish) return;

    const note = repostNoteMap[item.id]?.trim();
    const repost: PortalNews = buildBasePost({
      title: note ? `Repost: ${item.title}` : item.title,
      type: "Repost",
      summary: note || "Compartio esta publicacion con el equipo.",
      repostOfId: item.id,
      repostPreview: {
        title: item.title,
        authorName: item.authorName,
        summary: item.summary,
      },
    });

    save([repost, ...items]);
    if (!user.isMaster) addModerationNotification(repost.title);
    setRepostNoteMap((current) => ({ ...current, [item.id]: "" }));
  }

  function approvePost(id: string, nextStatus: "aprobado" | "rechazado") {
    const reason = rejectionReasonMap[id]?.trim() ?? "";
    const targetItem = items.find((item) => item.id === id);

    save(
      items.map((item) => {
        if (item.id !== id) return item;

        clearModerationNotification(item.title);

        if (nextStatus === "aprobado") {
          return {
            ...item,
            status: nextStatus,
            approvedAt: new Date().toISOString(),
            approvedByMatricula: user.matricula,
            approvedByName: user.name,
            rejectedAt: undefined,
            rejectedByMatricula: undefined,
            rejectedByName: undefined,
            rejectionReason: undefined,
          };
        }

        return {
          ...item,
          status: nextStatus,
          rejectedAt: new Date().toISOString(),
          rejectedByMatricula: user.matricula,
          rejectedByName: user.name,
          rejectionReason: reason || "La publicacion necesita ajustes antes de poder mostrarse al equipo.",
        };
      }),
    );

    if (targetItem && targetItem.authorMatricula !== user.matricula) {
      addNotification({
        kind: "moderation",
        title: nextStatus === "aprobado" ? "Publicacion aprobada" : "Publicacion rechazada",
        message:
          nextStatus === "aprobado"
            ? `${targetItem.title} ya fue aprobada y ahora es visible para el equipo.`
            : reason || "Tu publicacion necesita ajustes antes de poder mostrarse al equipo.",
        targetMatriculas: [targetItem.authorMatricula],
      });
    }

    setRejectionReasonMap((current) => ({ ...current, [id]: "" }));
  }

  function toggleStar(id: string) {
    if (!canInteractWithPosts) return;
    const targetItem = items.find((item) => item.id === id);
    const willStar = Boolean(targetItem && !targetItem.starredBy.includes(user.matricula));

    save(
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              starredBy: item.starredBy.includes(user.matricula)
                ? item.starredBy.filter((matricula) => matricula !== user.matricula)
                : [...item.starredBy, user.matricula],
            }
          : item,
      ),
    );

    if (targetItem && willStar && targetItem.authorMatricula !== user.matricula) {
      addNotification({
        kind: "social",
        title: "Nueva reaccion",
        message: `${user.name} reacciono con estrella a tu publicacion ${targetItem.title}.`,
        targetMatriculas: [targetItem.authorMatricula],
      });
    }
  }

  function addComment(id: string) {
    if (!canInteractWithPosts) return;
    const content = commentMap[id]?.trim();
    if (!content) return;
    const targetItem = items.find((item) => item.id === id);

    save(
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              comments: [
                {
                  id: crypto.randomUUID(),
                  authorMatricula: user.matricula,
                  authorName: user.name,
                  content,
                  createdAt: new Date().toISOString(),
                },
                ...item.comments,
              ],
            }
          : item,
      ),
    );

    if (targetItem && targetItem.authorMatricula !== user.matricula) {
      addNotification({
        kind: "social",
        title: "Nuevo comentario",
        message: `${user.name} comento en tu publicacion ${targetItem.title}.`,
        targetMatriculas: [targetItem.authorMatricula],
      });
    }

    setCommentMap((current) => ({ ...current, [id]: "" }));
  }

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      if (!user.isMaster && item.status !== "aprobado" && item.authorMatricula !== user.matricula) {
        return false;
      }

      if (filter === "mio" && item.authorMatricula !== user.matricula) return false;
      if (filter === "pendiente" && item.status !== "pendiente") return false;

      if (!search.trim()) return true;

      return `${item.title} ${item.summary} ${item.authorName} ${item.type}`
        .toLowerCase()
        .includes(search.toLowerCase());
    });
  }, [filter, items, search, user.isMaster, user.matricula]);

  return (
    <div className="stack-lg">
      <section className="panel welcome-news-panel">
        <p className="eyebrow">Feed social</p>
        <h2>{welcome.title}</h2>
        <p className="section-copy">{welcome.copy}</p>
        {user.isMaster ? (
          <div className="hero-actions">
            <span className="pill">{pendingCount} pendientes por moderar</span>
          </div>
        ) : null}
      </section>

      {canPublish ? (
        <section className="panel social-composer-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Crear publicacion</p>
              <h2>Comparte algo con la comunidad</h2>
            </div>
          </div>

          <div className="social-composer-grid">
            <label className="field field-span-2">
              <span>Titulo</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <label className="field">
              <span>Tipo</span>
              <input value={type} onChange={(event) => setType(event.target.value)} />
            </label>
            <label className="field field-span-2">
              <span>Contenido</span>
              <textarea value={summary} onChange={(event) => setSummary(event.target.value)} rows={4} />
            </label>
            <label className="field">
              <span>Imagen por enlace</span>
              <input
                type="url"
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                placeholder="https://drive.google.com/... o https://..."
              />
            </label>
          </div>

          <div className="hero-actions">
            <button type="button" className="primary-link action-button" onClick={createItem}>
              Publicar
            </button>
            {imageUrl ? <span className="pill">Se mostrara desde enlace</span> : null}
            {!user.isMaster ? <span className="pill subtle">Requiere aprobacion master</span> : null}
          </div>
        </section>
      ) : (
        <section className="panel social-composer-panel locked-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Crear publicacion</p>
              <h2>
                <span className="lock-icon" aria-hidden="true">
                  {lockIcon}
                </span>{" "}
                Publicacion bloqueada por ahora
              </h2>
            </div>
          </div>
          <p className="section-copy">{lockedMessage}</p>
          <div className="social-composer-grid">
            <label className="field field-span-2">
              <span>Titulo</span>
              <input value="" disabled placeholder="Se activara al completar tu entrenamiento" />
            </label>
            <label className="field">
              <span>Tipo</span>
              <input value="Post" disabled />
            </label>
            <label className="field field-span-2">
              <span>Contenido</span>
              <textarea
                value=""
                disabled
                rows={4}
                placeholder="Comparte con la comunidad cuando tu cuenta suba de nivel."
              />
            </label>
          </div>
          <div className="hero-actions">
            <button type="button" className="secondary-link action-button locked-button" disabled>
              {lockIcon} Publicar
            </button>
            <span className="pill subtle">Modo trainee</span>
          </div>
        </section>
      )}

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Feed social</p>
            <h2>Novedades, publicaciones y reposts</h2>
          </div>
        </div>

        <div className="stack-md">
          <label className="field search-field">
            <span>Buscar contenido</span>
            <div className="search-input-wrap">
              <span className="search-icon">{searchIcon}</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Busca por titulo, autor o tipo"
              />
            </div>
          </label>

          <div className="hero-actions">
            <button
              type="button"
              className={`secondary-link action-button ${filter === "todo" ? "topnav-active" : ""}`}
              onClick={() => setFilter("todo")}
            >
              Todo
            </button>
            {canPublish ? (
              <button
                type="button"
                className={`secondary-link action-button ${filter === "mio" ? "topnav-active" : ""}`}
                onClick={() => setFilter("mio")}
              >
                Mi contenido
              </button>
            ) : (
              <button type="button" className="secondary-link action-button locked-button" disabled title={lockedMessage}>
                {lockIcon} Mi contenido
              </button>
            )}
            {user.isMaster ? (
              <button
                type="button"
                className={`secondary-link action-button ${filter === "pendiente" ? "topnav-active" : ""}`}
                onClick={() => setFilter("pendiente")}
              >
                Pendiente
              </button>
            ) : null}
          </div>

          <div className="stack-sm">
            {visibleItems.length ? (
              visibleItems.map((item) => (
                <article key={item.id} className="role-mini-card social-post-card social-feed-card">
                  <div className="social-feed-head">
                    <div className="social-avatar-badge">{item.authorName.slice(0, 1)}</div>
                    <div className="social-feed-author">
                      <strong>{item.authorName}</strong>
                      <p>
                        {item.type} {" · "} {new Date(item.createdAt).toLocaleDateString("es-MX")}
                      </p>
                    </div>
                    <span className="pill subtle">{item.status}</span>
                  </div>

                  <div className="social-feed-body">
                    <strong>{item.title}</strong>
                    <p>{item.summary}</p>
                  </div>

                  {item.repostPreview ? (
                    <div className="social-repost-preview">
                      <span>Repost de {item.repostPreview.authorName}</span>
                      <strong>{item.repostPreview.title}</strong>
                      <p>{item.repostPreview.summary}</p>
                    </div>
                  ) : null}

                  {item.imageUrl && isImageLikeUrl(item.imageUrl) ? (
                    <img src={normalizeMediaUrl(item.imageUrl)} alt={item.title} className="post-image" />
                  ) : item.imageUrl ? (
                    <a href={normalizeMediaUrl(item.imageUrl)} target="_blank" rel="noreferrer" className="secondary-link">
                      Abrir recurso adjunto
                    </a>
                  ) : null}

                  <div className="hero-actions social-feed-actions">
                    {canInteractWithPosts ? (
                      <button type="button" className="secondary-link action-button" onClick={() => toggleStar(item.id)}>
                        {"★"} {item.starredBy.length}
                      </button>
                    ) : (
                      <button type="button" className="secondary-link action-button locked-button" disabled title={lockedMessage}>
                        {lockIcon} {"★"} {item.starredBy.length}
                      </button>
                    )}
                    <span className="pill">{item.comments.length} comentarios</span>
                    {canPublish ? (
                      <button type="button" className="secondary-link action-button" onClick={() => repostItem(item)}>
                        Repost
                      </button>
                    ) : (
                      <button type="button" className="secondary-link action-button locked-button" disabled title={lockedMessage}>
                        {lockIcon} Repost
                      </button>
                    )}
                    {user.isMaster && item.status === "pendiente" ? (
                      <>
                        <label className="field field-span-2">
                          <span>Motivo si rechazas</span>
                          <textarea
                            value={rejectionReasonMap[item.id] ?? ""}
                            onChange={(event) =>
                              setRejectionReasonMap((current) => ({ ...current, [item.id]: event.target.value }))
                            }
                            rows={2}
                          />
                        </label>
                        <button type="button" className="primary-link action-button" onClick={() => approvePost(item.id, "aprobado")}>
                          Aprobar
                        </button>
                        <button type="button" className="secondary-link action-button" onClick={() => approvePost(item.id, "rechazado")}>
                          Rechazar
                        </button>
                      </>
                    ) : null}
                  </div>

                  <div className="stack-sm">
                    {item.status === "rechazado" && item.authorMatricula === user.matricula ? (
                      <div className="notes-box">
                        <strong>Revision de master</strong>
                        <p>{item.rejectionReason || "Tu publicacion fue rechazada para ajuste."}</p>
                      </div>
                    ) : null}
                    {item.status === "aprobado" && item.approvedByName ? (
                      <div className="notes-box">
                        <strong>Aprobado por</strong>
                        <p>{item.approvedByName}</p>
                      </div>
                    ) : null}

                    {canPublish ? (
                      <label className="field">
                        <span>Nota para repost</span>
                        <textarea
                          value={repostNoteMap[item.id] ?? ""}
                          onChange={(event) =>
                            setRepostNoteMap((current) => ({ ...current, [item.id]: event.target.value }))
                          }
                          rows={2}
                          placeholder="Agrega contexto antes de volver a compartir"
                        />
                      </label>
                    ) : (
                      <div className="locked-card inline-locked-card">
                        <strong>
                          <span className="lock-icon" aria-hidden="true">
                            {lockIcon}
                          </span>{" "}
                          Repost bloqueado
                        </strong>
                        <p>{lockedMessage}</p>
                      </div>
                    )}

                    {canInteractWithPosts ? (
                      <>
                        <label className="field">
                          <span>Comentar</span>
                          <textarea
                            value={commentMap[item.id] ?? ""}
                            onChange={(event) => setCommentMap((current) => ({ ...current, [item.id]: event.target.value }))}
                            rows={3}
                          />
                        </label>
                        <div className="hero-actions">
                          <button type="button" className="secondary-link action-button" onClick={() => addComment(item.id)}>
                            Publicar comentario
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="locked-card inline-locked-card">
                        <strong>
                          <span className="lock-icon" aria-hidden="true">
                            {lockIcon}
                          </span>{" "}
                          Interaccion bloqueada
                        </strong>
                        <p>{lockedMessage}</p>
                        <div className="hero-actions">
                          <button type="button" className="secondary-link action-button locked-button" disabled>
                            {lockIcon} Publicar comentario
                          </button>
                        </div>
                      </div>
                    )}

                    {item.comments.length ? (
                      item.comments.map((comment) => (
                        <div key={comment.id} className="notes-box">
                          <strong>{comment.authorName}</strong>
                          <p>{comment.content}</p>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state">
                        <strong>Aun no hay comentarios.</strong>
                      </div>
                    )}
                  </div>
                </article>
              ))
            ) : (
              <div className="empty-state">
                <strong>No hay contenido para este filtro.</strong>
                <p>Cuando existan publicaciones aprobadas o tuyas, apareceran aqui.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
