import { useMemo } from 'react';
import { useAppStore } from '@core/store/useAppStore';
import type { ID, User } from '@core/types';
import { canViewField, isFriend, pendingRequestFrom } from '@core/lib/relations';

/** 현재 사용자 관점의 데이터 접근 헬퍼 (웹 useViewer의 모바일 축약판) */
export function useViewer() {
  const users = useAppStore((s) => s.users);
  const relationships = useAppStore((s) => s.relationships);
  const participations = useAppStore((s) => s.participations);
  const proposals = useAppStore((s) => s.proposals);
  const activities = useAppStore((s) => s.activities);
  const opportunities = useAppStore((s) => s.opportunities);
  const opportunityIntents = useAppStore((s) => s.opportunityIntents);
  const timePolls = useAppStore((s) => s.timePolls);
  const currentUserId = useAppStore((s) => s.currentUserId);

  return useMemo(() => {
    const snap = { users, relationships, participations, proposals, activities, opportunities, opportunityIntents, timePolls };
    const me = users.find((u) => u.id === currentUserId) as User;
    const blocked = new Set(relationships.blocks.filter((b) => b.fromId === me?.id || b.toId === me?.id).flatMap((b) => [b.fromId, b.toId]));
    const visibleUsers: User[] = me ? users.filter((u) => u.id !== me.id && !blocked.has(u.id)) : [];
    return {
      me, users, snap, visibleUsers,
      userById: (id: ID) => users.find((u) => u.id === id),
      isFriend: (to: ID) => isFriend(snap, me.id, to),
      pendingOut: (to: ID) => pendingRequestFrom(snap, me.id, to),
      canSeeField: (owner: User, field: keyof User['fieldVisibility']) => canViewField(snap, me, owner, field),
    };
  }, [users, relationships, participations, proposals, activities, opportunities, opportunityIntents, timePolls, currentUserId]);
}
