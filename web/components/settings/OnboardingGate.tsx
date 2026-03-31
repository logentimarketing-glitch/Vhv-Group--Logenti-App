"use client";

import { ReactNode, useEffect, useState } from "react";
import { getDefaultProfile, getProfileStorageKey, isProfileIncomplete, resolveStoredProfile, StoredProfile } from "@/lib/profile";
import { getUserStatus } from "@/lib/user-status";

type OnboardingGateProps = {
  user: {
    matricula: string;
    role: "administrador" | "novato" | "usuario";
    name: string;
    email: string;
    position: string;
    company?: string;
  } | null;
  children: ReactNode;
};

export function OnboardingGate({ user, children }: OnboardingGateProps) {
  const [ready, setReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [profile, setProfile] = useState<StoredProfile | null>(null);

  useEffect(() => {
    if (!user) {
      setReady(true);
      return;
    }

    if (getUserStatus(user) === "TRAINEE") {
      setReady(true);
      setNeedsOnboarding(false);
      return;
    }

    if (user.role === "usuario") {
      setReady(true);
      setNeedsOnboarding(false);
      return;
    }

    const storageKey = getProfileStorageKey(user.matricula);
    const fallback = getDefaultProfile(user);
    const raw = window.localStorage.getItem(storageKey);

    if (!raw) {
      setProfile(fallback);
      setNeedsOnboarding(isProfileIncomplete(fallback, user.role));
      setReady(true);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as StoredProfile;
      const resolved = resolveStoredProfile(user, parsed);
      setProfile(resolved);
      setNeedsOnboarding(isProfileIncomplete(resolved, user.role));
    } catch {
      setProfile(fallback);
      setNeedsOnboarding(isProfileIncomplete(fallback, user.role));
    }

    setReady(true);
  }, [user]);

  function updateField(field: keyof StoredProfile, value: string) {
    setProfile((current) => (current ? { ...current, [field]: value } : current));
  }

  function saveProfile() {
    if (!user || !profile) return;
    const storageKey = getProfileStorageKey(user.matricula);
    window.localStorage.setItem(storageKey, JSON.stringify(profile));
    setNeedsOnboarding(isProfileIncomplete(profile, user.role));
  }

  if (!ready) return null;

  if (!user || !needsOnboarding || !profile) {
    return <>{children}</>;
  }

  return (
    <div className="onboarding-shell">
      <section className="onboarding-card">
        <p className="eyebrow">Bienvenida inicial</p>
        <h1>Antes de continuar, configura tu acceso</h1>
        <p className="section-copy">
          Completa solo los datos necesarios para personalizar tu experiencia administrativa dentro de la plataforma.
        </p>

        <div className="form-grid">
          <label className="field">
            <span>Nombre</span>
            <input value={profile.name} onChange={(event) => updateField("name", event.target.value)} />
          </label>
          <label className="field">
            <span>Correo</span>
            <input value={profile.email} onChange={(event) => updateField("email", event.target.value)} />
          </label>
          <label className="field">
            <span>Puesto</span>
            <input value={profile.position} onChange={(event) => updateField("position", event.target.value)} />
          </label>
          <label className="field">
            <span>Empresa</span>
            <input value={profile.company} onChange={(event) => updateField("company", event.target.value)} />
          </label>
        </div>

        <div className="hero-actions">
          <button type="button" className="primary-link action-button" onClick={saveProfile}>
            Guardar y continuar
          </button>
        </div>
      </section>
    </div>
  );
}
