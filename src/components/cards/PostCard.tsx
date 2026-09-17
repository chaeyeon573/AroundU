import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Bookmark, Share2, MoreHorizontal, CalendarCheck, Flag, Trash2, BadgeCheck } from 'lucide-react';
import type { Post } from '@/types';
import { Avatar, Cover, Button, BottomSheet, Input, VisibilityTag } from '@/components/ui';
import { useViewer } from '@/hooks/useViewer';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/api';
import { relativeTime } from '@/lib/format';
import { cn } from '@/lib/cn';
import { ReportSheet } from '@/components/cards/ReportSheet';

export function PostCard({ post: p, className }: { post: Post; className?: string }) {
  const nav = useNavigate();
  const v = useViewer();
  const run = useAppStore((s) => s.run);
  const showToast = useAppStore((s) => s.showToast);
  const activities = useAppStore((s) => s.activities);
  const author = v.userById(p.authorId);
  const org = p.orgId ? v.orgById(p.orgId) : undefined;
  const related = p.relatedActivityId ? activities.find((a) => a.id === p.relatedActivityId) : undefined;
  const liked = p.likeIds.includes(v.me.id);
  const saved = p.savedIds.includes(v.me.id);
  const following = v.isFollowing(org ? org.id : p.authorId);
  const [comments, setComments] = useState(false);
  const [menu, setMenu] = useState(false);
  const [report, setReport] = useState(false);
  const [text, setText] = useState('');
  const [slide, setSlide] = useState(0);
  const isMine = p.authorId === v.me.id;

  const displayName = org?.name ?? author?.nickname ?? '알 수 없음';
  const avatar = org ? org.logo : author?.avatar ?? { emoji: '👤', hue: 200 };
  const goAuthor = () => nav(org ? `/orgs/${org.id}` : `/users/${p.authorId}`);

  return (
    <article className={cn('card overflow-hidden', className)}>
      <div className="flex items-center gap-2.5 px-3.5 py-3">
        <button onClick={goAuthor}><Avatar emoji={avatar.emoji} hue={avatar.hue} size={36} /></button>
        <div className="flex-1 min-w-0">
          <button onClick={goAuthor} className="text-[14px] font-bold truncate flex items-center gap-1">{displayName}{org?.verified && <BadgeCheck size={13} className="text-gold" />}</button>
          <div className="text-[11px] text-ink-3 flex items-center gap-1.5">{relativeTime(p.createdAt)} · <VisibilityTag value={p.visibility} /></div>
        </div>
        {!isMine && (
          <button onClick={() => run(() => api.relationships.toggleFollow(v.me.id, org ? org.id : p.authorId, org ? 'org' : 'user'))}
            className={cn('h-8 px-3 rounded-lg text-[12px] font-bold press', following ? 'bg-surface-2 text-ink-3' : 'bg-primary-soft text-primary')}>{following ? '팔로잉' : '팔로우'}</button>
        )}
        <button onClick={() => setMenu(true)} className="h-8 w-8 grid place-items-center text-ink-3" aria-label="더보기"><MoreHorizontal size={18} /></button>
      </div>
      <div className="relative">
        <div className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar" onScroll={(e) => setSlide(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}>
          {p.media.map((m, i) => <Cover key={i} emoji={m.emoji} hue={m.hue} className="h-[260px] w-full shrink-0 snap-center" size={80} />)}
        </div>
        {p.media.length > 1 && (
          <div className="absolute bottom-2.5 left-0 right-0 flex justify-center gap-1">{p.media.map((_, i) => <span key={i} className={cn('h-1.5 w-1.5 rounded-full', i === slide ? 'bg-white' : 'bg-white/50')} />)}</div>
        )}
      </div>
      <div className="px-3.5 pt-2.5 pb-3.5">
        <div className="flex items-center gap-1 -ml-2">
          <button onClick={() => run(() => api.posts.toggleLike(p.id, v.me.id))} className={cn('h-9 px-2 rounded-lg flex items-center gap-1 text-[13px] font-semibold press', liked ? 'text-heart' : 'text-ink-2')}><Heart size={20} fill={liked ? 'currentColor' : 'none'} />{p.likeIds.length}</button>
          <button onClick={() => setComments((c) => !c)} className="h-9 px-2 rounded-lg flex items-center gap-1 text-[13px] font-semibold text-ink-2 press"><MessageCircle size={20} />{p.comments.length}</button>
          <button onClick={() => showToast('링크를 복사했어요.')} className="h-9 px-2 rounded-lg text-ink-2 press"><Share2 size={20} /></button>
          <span className="flex-1" />
          <button onClick={() => run(() => api.posts.toggleSave(p.id, v.me.id), saved ? undefined : '저장했어요')} className={cn('h-9 px-2 rounded-lg press', saved ? 'text-primary' : 'text-ink-2')}><Bookmark size={20} fill={saved ? 'currentColor' : 'none'} /></button>
        </div>
        <p className="text-[14px] leading-relaxed mt-1"><b className="mr-1.5">{displayName}</b>{p.text}</p>
        {p.tags.length > 0 && <div className="mt-1 text-[12px] text-primary">{p.tags.map((t) => `#${t}`).join(' ')}</div>}
        {related && (
          <Button size="sm" variant="secondary" full className="mt-3" icon={<CalendarCheck size={15} />} onClick={() => nav(`/activities/${related.id}`)}>이 활동에 참여하기 · {related.title}</Button>
        )}
        {comments && (
          <div className="mt-3 border-t border-line pt-3 space-y-2">
            {p.comments.length === 0 && <p className="text-[12px] text-ink-3">첫 댓글을 남겨보세요.</p>}
            {p.comments.map((c) => { const u = v.userById(c.authorId); return (
              <div key={c.id} className="flex gap-2 text-[13px]"><Avatar emoji={u?.avatar.emoji ?? '👤'} hue={u?.avatar.hue ?? 200} size={24} /><div><b className="mr-1">{u?.nickname}</b>{c.text}<span className="text-ink-3 text-[11px] ml-1.5">{relativeTime(c.createdAt)}</span></div></div>
            ); })}
            <form className="flex gap-2 pt-1" onSubmit={async (e) => { e.preventDefault(); if (!text.trim()) return; await run(() => api.posts.comment(p.id, v.me.id, text.trim())); setText(''); }}>
              <Input placeholder="댓글 달기…" value={text} onChange={(e) => setText(e.target.value)} className="h-10" />
              <Button size="sm" className="h-10" type="submit" disabled={!text.trim()}>게시</Button>
            </form>
          </div>
        )}
      </div>
      <BottomSheet open={menu} onClose={() => setMenu(false)} title="게시물">
        <div className="space-y-1">
          {related && <SheetItem icon={<CalendarCheck size={18} />} label="관련 활동 확인" onClick={() => { setMenu(false); nav(`/activities/${related.id}`); }} />}
          {!isMine && <SheetItem icon={<Flag size={18} />} label="게시물 신고" danger onClick={() => { setMenu(false); setReport(true); }} />}
          {isMine && <SheetItem icon={<Trash2 size={18} />} label="삭제" danger onClick={async () => { setMenu(false); await run(() => api.posts.remove(p.id), '게시물을 삭제했어요.'); }} />}
        </div>
      </BottomSheet>
      <ReportSheet open={report} onClose={() => setReport(false)} targetType="post" targetId={p.id} />
    </article>
  );
}

export function SheetItem({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className={cn('w-full flex items-center gap-3 rounded-xl px-3 h-12 text-[14px] font-semibold press hover:bg-surface-2', danger ? 'text-danger' : 'text-ink')}>
      {icon}{label}
    </button>
  );
}
