import { PortalDirectMessage, STORAGE_KEYS } from "@/lib/portal-seeds";
import { readStorage, writeStorage } from "@/lib/storage";
import { readMemberDirectory } from "@/lib/personal-search";
import { getUserStatus } from "@/lib/user-status";
import { PortalMember } from "@/lib/portal-seeds";
import { addNotification } from "@/lib/notifications";

type SendMessageInput = {
  from: string;
  to: string;
  fromName: string;
  toName: string;
  content: string;
};

export function readDirectMessages() {
  return readStorage<PortalDirectMessage[]>(STORAGE_KEYS.directMessages, []);
}

export function saveDirectMessages(messages: PortalDirectMessage[]) {
  writeStorage(STORAGE_KEYS.directMessages, messages);
}

const DELETE_WINDOW_MS = 12 * 60 * 60 * 1000;

export function canAdminDeleteMessage(
  viewer: {
    role: "administrador" | "novato" | "usuario";
    status?: "TRAINEE" | "ACTIVE_EMPLOYEE" | "ADMIN";
  },
  message: Pick<PortalDirectMessage, "createdAt">,
) {
  if (getUserStatus(viewer) !== "ADMIN") return false;
  return Date.now() - new Date(message.createdAt).getTime() <= DELETE_WINDOW_MS;
}

export function deleteDirectMessage(messageId: string) {
  const current = readDirectMessages();
  const next = current.filter((message) => message.id !== messageId);
  saveDirectMessages(next);
  return next;
}

export function deleteConversationForUser(matricula: string, participantMatricula: string) {
  const current = readDirectMessages();
  const next = current.filter((message) => {
    const matchesDirectPair =
      (message.from === matricula && message.to === participantMatricula) ||
      (message.from === participantMatricula && message.to === matricula);
    return !matchesDirectPair;
  });

  saveDirectMessages(next);
  return next;
}

export function canMessageMember(
  viewer: {
    matricula: string;
    company?: string;
    role: "administrador" | "novato" | "usuario";
    status?: "TRAINEE" | "ACTIVE_EMPLOYEE" | "ADMIN";
  },
  target: Pick<PortalMember, "matricula" | "company" | "role" | "status">,
) {
  if (viewer.matricula === target.matricula) return false;

  const viewerStatus = getUserStatus(viewer);
  const targetStatus = getUserStatus(target);

  if (viewerStatus === "ADMIN") return true;
  if (targetStatus === "ADMIN") return true;

  return Boolean(viewer.company && target.company && viewer.company === target.company);
}

export function sendDirectMessage(input: SendMessageInput) {
  const content = input.content.trim();
  if (!content) return readDirectMessages();

  const current = readDirectMessages();
  const next: PortalDirectMessage[] = [
    {
      id: crypto.randomUUID(),
      from: input.from,
      to: input.to,
      fromName: input.fromName,
      toName: input.toName,
      content,
      createdAt: new Date().toISOString(),
    },
    ...current,
  ];

  saveDirectMessages(next);
  addNotification({
    kind: "message",
    title: `Nuevo mensaje de ${input.fromName}`,
    message: content,
    targetMatriculas: [input.to],
  });
  return next;
}

export function getMessageThreadsForUser(matricula: string) {
  const messages = readDirectMessages().filter(
    (message) => message.from === matricula || message.to === matricula,
  );

  const threadMap = new Map<
    string,
    { participantMatricula: string; participantName: string; messages: PortalDirectMessage[] }
  >();

  messages.forEach((message) => {
    const participantMatricula = message.from === matricula ? message.to : message.from;
    const participantName = message.from === matricula ? message.toName : message.fromName;
    const existing = threadMap.get(participantMatricula);

    if (existing) {
      existing.messages.push(message);
      return;
    }

    threadMap.set(participantMatricula, {
      participantMatricula,
      participantName,
      messages: [message],
    });
  });

  return Array.from(threadMap.values()).map((thread) => ({
    ...thread,
    messages: [...thread.messages].sort(
      (left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
    ),
  }));
}

type SuggestionViewer = {
  matricula: string;
  role: "administrador" | "novato" | "usuario";
  company?: string;
  isMaster?: boolean;
  status?: "TRAINEE" | "ACTIVE_EMPLOYEE" | "ADMIN";
};

export function getMessageSuggestions(viewer: SuggestionViewer) {
  const members = readMemberDirectory();
  const viewerStatus = getUserStatus(viewer);

  if (viewerStatus === "TRAINEE") {
    return {
      administracion: [],
      usuarios: [],
      novatos: [],
    };
  }

  const visible = members.filter((member) => {
    if (member.matricula === viewer.matricula) return false;

    if (viewerStatus === "ADMIN") return true;

    const memberStatus = getUserStatus(member);
    if (memberStatus === "ADMIN") {
      return member.name !== "Logenti";
    }

    return member.company === viewer.company && memberStatus === "ACTIVE_EMPLOYEE";
  });

  return {
    administracion: visible.filter((member) => getUserStatus(member) === "ADMIN"),
    usuarios: visible.filter((member) => getUserStatus(member) === "ACTIVE_EMPLOYEE"),
    novatos: visible.filter((member) => getUserStatus(member) === "TRAINEE"),
  };
}
