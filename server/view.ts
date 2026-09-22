/**
 * 사용자 관점으로 스냅샷·패치를 걸러낸다.
 * - 알림·신고는 본인 것만
 * - 다른 사람의 시간표 강의실(room)은 절대 내려보내지 않는다
 */
import type { Patch, Snapshot } from '@/api/types';
import type { ID, User } from '@/types';

function sanitizeUser(u: User, viewerId: ID): User {
  if (u.id === viewerId) return u;
  return { ...u, timetable: u.timetable.map(({ room: _room, ...c }) => c) };
}

export function snapshotFor(db: Snapshot, viewerId: ID): Snapshot {
  return {
    ...db,
    users: db.users.map((u) => sanitizeUser(u, viewerId)),
    notifications: db.notifications.filter((n) => n.userId === viewerId),
    reports: db.reports.filter((r) => r.reporterId === viewerId),
  };
}

export function patchFor(patch: Patch, viewerId: ID): Patch | null {
  const out: Patch = { ...patch };
  if (patch.users) out.users = patch.users.map((u) => sanitizeUser(u, viewerId));
  if (patch.notifications) out.notifications = patch.notifications.filter((n) => n.userId === viewerId);
  if (patch.reports) out.reports = patch.reports.filter((r) => r.reporterId === viewerId);
  const hasContent = Object.entries(out).some(([k, v]) => (k === 'relationships' ? !!v : k === 'removed' ? !!v && Object.values(v).some((ids) => ids && ids.length) : Array.isArray(v) && v.length > 0));
  return hasContent ? out : null;
}
