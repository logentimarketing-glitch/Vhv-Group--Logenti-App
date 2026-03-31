"use client";

import { useEffect, useState } from "react";
import { PortalMember } from "@/lib/portal-seeds";
import { readMemberDirectory } from "@/lib/personal-search";
import { ProfileViewer } from "@/components/home/ProfileViewer";
import { getUserStatus } from "@/lib/user-status";

type ProfileLookupProps = {
  viewer: {
    matricula: string;
    role: "administrador" | "novato" | "usuario";
    company?: string;
    status?: "TRAINEE" | "ACTIVE_EMPLOYEE" | "ADMIN";
  };
  matricula: string;
};

export function ProfileLookup({ viewer, matricula }: ProfileLookupProps) {
  const [person, setPerson] = useState<PortalMember | null>(null);
  const viewerStatus = getUserStatus(viewer);

  useEffect(() => {
    const member = readMemberDirectory().find((item) => item.matricula === matricula) ?? null;
    setPerson(member);
  }, [matricula]);

  if (!person) {
    return (
      <div className="panel">
        <div className="empty-state">
          <strong>No encontré ese perfil.</strong>
          <p>La persona puede no estar cargada todavía en el directorio actual.</p>
        </div>
      </div>
    );
  }

  const personStatus = getUserStatus(person);

  if (viewerStatus !== "ADMIN" && personStatus === "TRAINEE") {
    return (
      <div className="panel">
        <div className="empty-state">
          <strong>No puedes ver este perfil.</strong>
          <p>Solo puedes consultar personal administrativo y usuarios activos.</p>
        </div>
      </div>
    );
  }

  return <ProfileViewer viewer={viewer} person={person} />;
}
