"use client";

import { useEffect, useState } from "react";
import { PortalNews, STORAGE_KEYS } from "@/lib/portal-seeds";
import { getDefaultProfile, getProfileStorageKey, resolveStoredProfile, StoredProfile } from "@/lib/profile";

type AdminSpaceProps = {
  user: {
    matricula: string;
    name: string;
    email: string;
    position: string;
    role: "administrador";
    company?: string;
  };
};

export function AdminSpace({ user }: AdminSpaceProps) {
  const [profile, setProfile] = useState<StoredProfile>(getDefaultProfile(user));
  const [items, setItems] = useState<PortalNews[]>([]);

  useEffect(() => {
    const rawProfile = window.localStorage.getItem(getProfileStorageKey(user.matricula));
    if (rawProfile) {
      try {
        setProfile(resolveStoredProfile(user, JSON.parse(rawProfile) as StoredProfile));
      } catch {}
    }

    const rawNews = window.localStorage.getItem(STORAGE_KEYS.news);
    if (rawNews) {
      try {
        setItems(JSON.parse(rawNews) as PortalNews[]);
      } catch {}
    }
  }, [user]);

  return (
    <div className="member-feed-layout">
      <section className="facebook-profile-shell admin-profile-shell">
        <div className="facebook-cover admin-facebook-cover" />
        <div className="facebook-profile-head">
          <div className="facebook-avatar large admin-avatar">
            {profile.photoUrl ? <img src={profile.photoUrl} alt={profile.name} /> : <span>{profile.name.slice(0, 1)}</span>}
          </div>
          <div className="facebook-profile-copy">
            <h1>{profile.name || user.name}</h1>
            <p>{profile.position || user.position}</p>
            <span>{user.company || "VHV Group"}</span>
          </div>
        </div>
      </section>

      <div className="member-feed-columns">
        <aside className="role-surface">
          <p className="role-section-label">Tu espacio</p>
          <h2>Resumen personal</h2>
          <div className="stack-sm">
            <div className="role-mini-card">
              <strong>Perfil</strong>
              <p>{profile.bio || "Agrega tu presentacion desde perfil para completar tu espacio."}</p>
            </div>
            <div className="role-mini-card">
              <strong>Accesos rapidos</strong>
              <p>Desde aqui puedes saltar a control, personas, cursos y novedades.</p>
            </div>
          </div>
        </aside>

        <section className="role-surface">
          <p className="role-section-label">Novedades</p>
          <h2>Actividad reciente</h2>
          <div className="stack-sm">
            {items.length ? (
              items.map((item) => (
                <article key={item.id} className="role-mini-card">
                  <strong>{item.title}</strong>
                  <p>{item.summary}</p>
                  <span>{item.type}</span>
                </article>
              ))
            ) : (
              <div className="empty-state admin-empty-state">
                <strong>Aun no hay novedades publicadas.</strong>
                <p>Cuando el equipo publique avisos, blogs o videos apareceran aqui.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
