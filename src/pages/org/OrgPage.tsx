import { useNavigate, useParams } from 'react-router-dom';
import { BadgeCheck, Users, Megaphone, CalendarDays, MapPin, Bell, MessageCircle } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { Avatar, Button, Cover, Tag, EmptyState } from '@/components/ui';
import { ActivityCard } from '@/components/cards/ActivityCard';
import { PostCard } from '@/components/cards/PostCard';
import { useViewer } from '@/hooks/useViewer';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/api';
import { ORG_TYPE_LABELS } from '@/lib/labels';
import { relativeTime, todayISO } from '@/lib/format';

export function OrgPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const v = useViewer();
  const run = useAppStore((s) => s.run);
  const orgs = useAppStore((s) => s.organizations);
  const schools = useAppStore((s) => s.schools);
  const rooms = useAppStore((s) => s.chatRooms);
  const org = orgs.find((o) => o.id === id);
  if (!org) return <div className="min-h-full"><TopBar back title="조직" /><EmptyState emoji="🏛️" title="조직을 찾을 수 없어요" /></div>;
  const school = schools.find((s) => s.id === org.schoolId);
  const following = v.isFollowing(org.id);
  const isMember = org.memberIds.includes(v.me.id);
  const isApplicant = org.applicantIds.includes(v.me.id);
  const events = v.visibleActivities.filter((a) => a.orgId === org.id && a.date >= todayISO());
  const posts = v.visiblePosts.filter((p) => p.orgId === org.id);
  const room = rooms.find((r) => r.orgId === org.id && r.memberIds.includes(v.me.id));

  return (
    <div className="min-h-full pb-8">
      <TopBar back title={org.name} messages />
      <Cover emoji={org.logo.emoji} hue={org.logo.hue} className="h-[140px]" size={60} />
      <div className="px-4 -mt-8 relative">
        <div className="card p-4">
          <div className="flex items-start gap-3">
            <Avatar emoji={org.logo.emoji} hue={org.logo.hue} size={64} className="!rounded-2xl ring-4 ring-white -mt-10" />
            <div className="flex-1 min-w-0">
              <h1 className="text-[18px] font-extrabold flex items-center gap-1 leading-tight">{org.name}{org.verified && <BadgeCheck size={18} className="text-gold shrink-0" />}</h1>
              <div className="text-[12px] text-ink-3 mt-0.5">{school?.name}{org.parent ? ` · ${org.parent}` : ''} · {ORG_TYPE_LABELS[org.type]}</div>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3 text-[12px] text-ink-2">
            <span className="flex items-center gap-1"><Users size={13} className="text-ink-3" />팔로워 <b>{org.followerIds.length}</b></span>
            <span>회원 <b>{org.memberIds.length}</b></span>
            {org.verified ? <Tag tone="gold"><BadgeCheck size={11} /> 공식 인증</Tag> : <Tag>미인증</Tag>}
          </div>
          <p className="text-[14px] text-ink-2 leading-relaxed mt-3">{org.description}</p>
          <div className="flex gap-2 mt-4">
            <Button full variant={following ? 'secondary' : 'outline'} icon={<Bell size={16} />} onClick={() => run(() => api.relationships.toggleFollow(v.me.id, org.id, 'org'), following ? undefined : '팔로우했어요. 새 행사 알림을 받아요.')}>{following ? '팔로잉' : '팔로우'}</Button>
            {isMember ? <Button full variant="secondary" disabled>회원</Button> : isApplicant ? <Button full variant="outline" disabled>지원 완료</Button> :
              <Button full onClick={() => run(() => api.orgs.apply(org.id, v.me.id), '지원서를 보냈어요.')}>{org.recruitment?.open ? '가입 지원' : '가입 문의'}</Button>}
            {room && <Button variant="outline" icon={<MessageCircle size={16} />} onClick={() => nav(`/chats/${room.id}`)} />}
          </div>
        </div>

        {org.recruitment && (
          <div className="card mt-3 p-4 bg-[linear-gradient(120deg,#FFF4DE,#FFFFFF)]">
            <div className="flex items-center gap-2"><Megaphone size={16} className="text-[#B57A0E]" /><b className="text-[14px]">{org.recruitment.title}</b>{org.recruitment.open && <Tag tone="accent">모집 중</Tag>}</div>
            <div className="text-[12px] text-ink-2 mt-1">모집 기간 · {org.recruitment.period}</div>
          </div>
        )}

        <div className="card mt-3 p-4"><b className="text-[14px]">사진과 영상</b><div className="flex gap-2 overflow-x-auto hide-scrollbar mt-3">{org.gallery.map((g, i) => <div key={i} className="shrink-0 w-[120px]"><Cover emoji={g.emoji} hue={g.hue} className="h-[120px] rounded-xl" size={40} /><div className="text-[11px] text-ink-3 mt-1 text-center">{g.caption}</div></div>)}</div></div>

        <div className="card mt-3 p-4"><b className="text-[14px] flex items-center gap-1.5"><CalendarDays size={15} className="text-primary" />정기 활동</b><ul className="mt-2 space-y-1.5">{org.regularActivities.map((r) => <li key={r} className="text-[13px] text-ink-2 flex gap-2"><span className="text-primary">•</span>{r}</li>)}</ul></div>

        <div className="mt-4"><h2 className="text-[15px] font-bold mb-2 flex items-center gap-1.5"><MapPin size={15} className="text-primary" />예정된 행사 · 지도에 표시된 활동</h2>
          {events.length ? <div className="space-y-2">{events.map((a) => <ActivityCard key={a.id} activity={a} variant="row" />)}</div> : <div className="card p-4 text-[13px] text-ink-3">예정된 행사가 없어요.</div>}</div>

        <div className="card mt-4 p-4"><b className="text-[14px]">공지사항</b>
          {org.notices.length === 0 && <p className="text-[13px] text-ink-3 mt-2">공지가 없어요.</p>}
          <div className="mt-2 space-y-3">{org.notices.map((n) => <div key={n.id}><div className="text-[13px] font-semibold">{n.title}</div><div className="text-[12px] text-ink-2">{n.body}</div><div className="text-[11px] text-ink-3">{relativeTime(n.createdAt)}</div></div>)}</div></div>

        {posts.length > 0 && <div className="mt-4 space-y-3"><h2 className="text-[15px] font-bold">게시물</h2>{posts.map((p) => <PostCard key={p.id} post={p} />)}</div>}
        <p className="text-[11px] text-ink-3 mt-4 text-center">학생 동아리의 기본 행사 등록과 홍보는 무료예요.</p>
      </div>
    </div>
  );
}
