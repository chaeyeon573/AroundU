import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, MessageCircle } from 'lucide-react';
import { IconButton } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/cn';

interface Props {
  title?: ReactNode;
  back?: boolean;
  right?: ReactNode;
  /** 오른쪽 위 메시지 아이콘 (모든 주요 화면 공통) */
  messages?: boolean;
  bell?: boolean;
  transparent?: boolean;
  className?: string;
}

export function useUnreadCounts() {
  const me = useAppStore((s) => s.currentUserId);
  const rooms = useAppStore((s) => s.chatRooms);
  const notifications = useAppStore((s) => s.notifications);
  const proposals = useAppStore((s) => s.proposals);
  const requests = useAppStore((s) => s.relationships.friendRequests);
  if (!me) return { chats: 0, bell: 0 };
  const unreadRooms = rooms.filter((r) => r.memberIds.includes(me) && r.messages.some((m) => m.senderId !== me && new Date(m.createdAt) > new Date(r.lastReadAt[me] ?? 0))).length;
  const pendingReq = proposals.filter((p) => p.toId === me && p.status === 'pending').length + requests.filter((q) => q.toId === me && q.status === 'pending').length;
  return { chats: unreadRooms + pendingReq, bell: notifications.filter((n) => n.userId === me && !n.read).length };
}

export function TopBar({ title, back, right, messages, bell, transparent, className }: Props) {
  const nav = useNavigate();
  const counts = useUnreadCounts();
  return (
    <header className={cn('sticky top-0 z-30 flex items-center gap-1 h-14 px-2', transparent ? 'bg-transparent' : 'bg-bg/90 backdrop-blur border-b border-line/60', className)}>
      {back && <IconButton onClick={() => (window.history.length > 1 ? nav(-1) : nav('/'))} aria-label="뒤로"><ArrowLeft size={22} /></IconButton>}
      <div className={cn('flex-1 min-w-0 text-[17px] font-bold truncate', !back && 'pl-2')}>{title}</div>
      {right}
      {bell && <IconButton onClick={() => nav('/notifications')} badge={counts.bell} aria-label="알림"><Bell size={22} /></IconButton>}
      {messages && <IconButton onClick={() => nav('/chats')} badge={counts.chats} aria-label="메시지"><MessageCircle size={22} /></IconButton>}
    </header>
  );
}
