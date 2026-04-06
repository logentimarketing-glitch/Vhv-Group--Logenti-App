"use client";

import { useEffect, useMemo, useState } from "react";
import {
  PortalNotification,
  getNotificationsForUser,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/notifications";

type NotificationsCenterProps = {
  user: {
    matricula: string;
    name: string;
    role: "administrador" | "novato" | "usuario";
    status?: "TRAINEE" | "ACTIVE_EMPLOYEE" | "ADMIN";
  };
};

export function NotificationsCenter({ user }: NotificationsCenterProps) {
  const [items, setItems] = useState<PortalNotification[]>([]);

  useEffect(() => {
    const sync = () => {
      setItems(getNotificationsForUser(user.matricula));
    };

    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [user.matricula]);

  const unreadCount = useMemo(
    () => items.filter((item) => !item.readBy.includes(user.matricula)).length,
    [items, user.matricula],
  );

  function handleRead(id: string) {
    markNotificationRead(id, user.matricula);
    setItems(getNotificationsForUser(user.matricula));
  }

  function handleReadAll() {
    markAllNotificationsRead(user.matricula);
    setItems(getNotificationsForUser(user.matricula));
  }

  return (
    <div className="stack-lg">
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Centro de alertas</p>
            <h1>Notificaciones</h1>
            <p className="section-copy">
              Aqui veras mensajes nuevos, actividad social y avisos del sistema compartidos para tu cuenta.
            </p>
          </div>
          <div className="hero-actions">
            <span className="pill">{unreadCount} sin leer</span>
            <button type="button" className="secondary-link action-button" onClick={handleReadAll}>
              Marcar todo como leido
            </button>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="stack-sm">
          {items.length ? (
            items.map((item) => {
              const unread = !item.readBy.includes(user.matricula);

              return (
                <article key={item.id} className={`role-mini-card ${unread ? "notification-card-unread" : ""}`}>
                  <div className="hero-actions">
                    <div className="stack-sm">
                      <strong>{item.title}</strong>
                      <p>{item.message}</p>
                      <div className="hero-actions">
                        {item.priority === "high" ? <span className="pill warning">Prioritaria</span> : null}
                        <span className="pill subtle">{new Date(item.createdAt).toLocaleString("es-MX")}</span>
                      </div>
                    </div>
                    {unread ? (
                      <button
                        type="button"
                        className="primary-link action-button"
                        onClick={() => handleRead(item.id)}
                      >
                        Marcar leida
                      </button>
                    ) : (
                      <span className="pill">Leida</span>
                    )}
                  </div>
                </article>
              );
            })
          ) : (
            <div className="empty-state">
              <strong>No tienes notificaciones por ahora.</strong>
              <p>Cuando haya mensajes, aprobaciones o actividad social, aparecera aqui.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
