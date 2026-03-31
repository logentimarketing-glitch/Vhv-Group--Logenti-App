import { PortalConnection, PortalMember, STORAGE_KEYS } from "@/lib/portal-seeds";
import { readStorage, writeStorage } from "@/lib/storage";
import { readMemberDirectory } from "@/lib/personal-search";

function normalizePair(a: string, b: string): [string, string] {
  const sorted = [a, b].sort();
  return [sorted[0] ?? a, sorted[1] ?? b];
}

export function readConnections() {
  return readStorage<PortalConnection[]>(STORAGE_KEYS.connections, []);
}

export function writeConnections(connections: PortalConnection[]) {
  writeStorage(STORAGE_KEYS.connections, connections);
}

export function areUsersConnected(
  connections: PortalConnection[],
  a: string,
  b: string,
) {
  const [first, second] = normalizePair(a, b);
  return connections.some(
    (connection) =>
      connection.users[0] === first && connection.users[1] === second,
  );
}

export function toggleConnection(
  connections: PortalConnection[],
  a: string,
  b: string,
  createdBy: string,
): PortalConnection[] {
  const [first, second] = normalizePair(a, b);
  const existing = connections.find(
    (connection) =>
      connection.users[0] === first && connection.users[1] === second,
  );

  if (existing) {
    return connections.filter((connection) => connection.id !== existing.id);
  }

  return [
    {
      id: crypto.randomUUID(),
      users: [first, second],
      createdAt: new Date().toISOString(),
      createdBy,
    },
    ...connections,
  ];
}

export function getUserConnections(
  matricula: string,
  members: PortalMember[] = readMemberDirectory(),
  connections: PortalConnection[] = readConnections(),
) {
  const relatedIds = connections
    .filter((connection) => connection.users.includes(matricula))
    .map((connection) =>
      connection.users[0] === matricula ? connection.users[1] : connection.users[0],
    );

  return relatedIds
    .map((id) => members.find((member) => member.matricula === id) ?? null)
    .filter((member): member is PortalMember => Boolean(member));
}
