"use client";

import { useEffect, useState } from "react";
import {
  dispatchCloudSync,
  dispatchProfileUpdated,
} from "@/lib/cloud-sync";
import {
  canUseProfilePhoto,
  getDefaultProfile,
  getProfileStorageKey,
  readProfileRegistry,
  resolveStoredProfile,
  StoredProfile,
  upsertProfileRegistryEntry,
} from "@/lib/profile";
import { normalizeMediaUrl } from "@/lib/media-links";
import { readStorage, writeStorage } from "@/lib/storage";
import { PortalNews, STORAGE_KEYS } from "@/lib/portal-seeds";
import { getStatusLabel, getUserStatus } from "@/lib/user-status";

type ProfileEditorProps = {
  user: {
    matricula: string;
    role: "administrador" | "novato" | "usuario";
    name: string;
    email: string;
    position: string;
    company?: string;
  };
};

export function ProfileEditor({ user }: ProfileEditorProps) {
  const storageKey = getProfileStorageKey(user.matricula);
  const [profile, setProfile] = useState<StoredProfile>(getDefaultProfile(user));
  const [saved, setSaved] = useState(false);
  const [ownPosts, setOwnPosts] = useState<PortalNews[]>([]);
  const status = getUserStatus(user);
  const canExtendProfile = status !== "TRAINEE";
  const canEditPhoto = canUseProfilePhoto(user);
  const isAdministrativeStaff = status === "ADMIN";

  useEffect(() => {
    const registry = readProfileRegistry();
    const stored = registry[user.matricula] ?? readStorage<StoredProfile | null>(storageKey, null);
    if (!stored) {
      setProfile(getDefaultProfile(user));
      return;
    }

    try {
      setProfile(resolveStoredProfile(user, stored));
    } catch {
      setProfile(getDefaultProfile(user));
    }

    setOwnPosts(
      readStorage<PortalNews[]>(STORAGE_KEYS.news, []).filter(
        (item) => item.authorMatricula === user.matricula,
      ),
    );
  }, [storageKey, user]);

  function updateField(field: keyof StoredProfile, value: string) {
    setSaved(false);
    setProfile((current) => ({ ...current, [field]: value }));
  }

  function handleSave() {
    const nextProfile = {
      ...profile,
      photoUrl: canEditPhoto ? normalizeMediaUrl(profile.photoUrl) : "",
    };
    writeStorage(storageKey, nextProfile);
    upsertProfileRegistryEntry(user.matricula, nextProfile);
    setProfile(nextProfile);
    dispatchProfileUpdated();
    dispatchCloudSync();
    setSaved(true);
  }

  if (status === "TRAINEE") {
    return (
      <section className="facebook-profile-shell status-shell-trainee">
        <div className="facebook-cover" />
        <div className="facebook-profile-head">
          <div className="facebook-avatar large">
            <span>{user.name.slice(0, 1) || "?"}</span>
          </div>
          <div className="facebook-profile-copy">
            <span className="status-pill status-pill-trainee">{getStatusLabel(status)}</span>
            <h1>{user.name}</h1>
            <p>{user.position}</p>
            <span>Acceso inicial guiado</span>
          </div>
        </div>

        <div className="member-feed-columns">
          <aside className="role-surface">
            <p className="role-section-label">Perfil bloqueado</p>
            <h2>Tu cuenta esta en modo novato</h2>
            <div className="stack-sm">
              <div className="role-mini-card">
                <strong>Candado activo</strong>
                <p>Este perfil se habilita cuando subas a nivel usuario.</p>
              </div>
              <div className="role-mini-card">
                <strong>Nombre</strong>
                <p>{user.name}</p>
              </div>
              <div className="role-mini-card">
                <strong>Puesto</strong>
                <p>{user.position}</p>
              </div>
              <div className="role-mini-card">
                <strong>Funciones activas</strong>
                <p>Ver novedades, entrar a cursos autorizados y hablar con soporte.</p>
              </div>
              <div className="role-mini-card">
                <strong>Edicion bloqueada</strong>
                <p>Tu nombre, foto, correo y datos de perfil aun no se pueden editar hasta que avances a usuario.</p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    );
  }

  return (
    <section className={`facebook-profile-shell ${isAdministrativeStaff ? "admin-profile-shell" : ""} ${status === "ACTIVE_EMPLOYEE" ? "status-shell-active" : ""}`}>
      <div className={`facebook-cover ${isAdministrativeStaff ? "admin-facebook-cover" : ""}`} />
      <div className="facebook-profile-head">
        <div className={`facebook-avatar large ${isAdministrativeStaff ? "admin-avatar" : ""}`}>
          {profile.photoUrl ? <img src={profile.photoUrl} alt={profile.name} /> : <span>{profile.name.slice(0, 1) || "?"}</span>}
        </div>
        <div className="facebook-profile-copy">
          {isAdministrativeStaff ? <span className="admin-badge">ADMIN STAFF</span> : null}
          {!isAdministrativeStaff ? (
            <span className={`status-pill ${status === "ACTIVE_EMPLOYEE" ? "status-pill-active" : "status-pill-trainee"}`}>
              {getStatusLabel(status)}
            </span>
          ) : null}
          <h1>{user.name}</h1>
          <p>{user.position}</p>
          <span>{user.company || "VHV Group"}</span>
        </div>
      </div>

      <div className="member-feed-columns">
        <aside className={`role-surface ${isAdministrativeStaff ? "admin-profile-surface" : ""}`}>
          <p className="role-section-label">Presentacion</p>
          <h2>Acerca de ti</h2>
          <div className="stack-sm">
            <div className="role-mini-card">
              <strong>Correo</strong>
              <p>{user.email || "Sin correo definido"}</p>
            </div>
            <div className="role-mini-card">
              <strong>Biografia</strong>
              <p>{profile.bio || "Todavia no has agregado una presentacion profesional."}</p>
            </div>
            <div className="role-mini-card">
              <strong>Publicaciones</strong>
              <p>{ownPosts.length}</p>
            </div>
          </div>
        </aside>

        <section className={`role-surface ${isAdministrativeStaff ? "admin-profile-surface" : ""}`}>
          <p className="role-section-label">Editar perfil</p>
          <h2>Tu informacion profesional</h2>

          <div className="form-grid">
            <label className={`field ${isAdministrativeStaff ? "admin-profile-field" : ""}`}>
              <span>Nombre</span>
              <input value={user.name} readOnly />
            </label>
            <label className={`field ${isAdministrativeStaff ? "admin-profile-field" : ""}`}>
              <span>Correo</span>
              <input value={user.email} readOnly />
            </label>
            <label className={`field ${isAdministrativeStaff ? "admin-profile-field" : ""}`}>
              <span>Puesto</span>
              <input value={user.position} readOnly />
            </label>
            <label className={`field ${isAdministrativeStaff ? "admin-profile-field" : ""}`}>
              <span>Empresa</span>
              <input value={user.company ?? profile.company} readOnly />
            </label>
            {canExtendProfile && canEditPhoto ? (
              <label className={`field ${isAdministrativeStaff ? "admin-profile-field" : ""}`}>
                <span>Foto de perfil por enlace</span>
                <input
                  type="url"
                  value={profile.photoUrl}
                  onChange={(event) => updateField("photoUrl", event.target.value)}
                  placeholder="https://..."
                />
              </label>
            ) : null}
            {canExtendProfile && !canEditPhoto ? (
              <div className={`role-mini-card ${isAdministrativeStaff ? "admin-profile-surface" : ""}`}>
                <strong>Foto de perfil restringida</strong>
                <p>Tu foto de perfil se habilitara cuando avances de novato a usuario.</p>
              </div>
            ) : null}
            {canExtendProfile ? (
              <label className={`field field-span-2 ${isAdministrativeStaff ? "admin-profile-field" : ""}`}>
                <span>Presentacion profesional</span>
                <textarea value={profile.bio} onChange={(event) => updateField("bio", event.target.value)} rows={5} />
              </label>
            ) : null}
          </div>

          <div className="hero-actions">
            <button type="button" className="primary-link action-button" onClick={handleSave}>
              Guardar perfil
            </button>
            {saved ? <span className="pill">Guardado para todo el equipo</span> : null}
          </div>
        </section>
      </div>

      <section className={`role-surface ${isAdministrativeStaff ? "admin-profile-surface" : ""}`}>
        <p className="role-section-label">Tu muro</p>
        <h2>Lo que has publicado</h2>
        <div className="stack-sm">
          {ownPosts.length ? (
            ownPosts.map((post) => (
              <article key={post.id} className="social-card">
                <strong>{post.title}</strong>
                <p>{post.summary}</p>
                <span className="pill subtle">{post.status}</span>
              </article>
            ))
          ) : (
            <div className="empty-state">
              <strong>Aun no has publicado nada.</strong>
              <p>Cuando publiques en novedades, tus posts apareceran aqui.</p>
            </div>
          )}
        </div>
      </section>
    </section>
  );
}
