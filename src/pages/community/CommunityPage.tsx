import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PenSquare, Megaphone, Bell, ChevronRight, BadgeCheck } from 'lucide-react';
import { t, lang } from '@/i18n';
import { TopBar } from '@/components/layout/TopBar';
import { Chip, ChipRow, Button, CardSkeleton, EmptyState, ErrorState, Avatar, Tag } from '@/components/ui';
import { PostCard } from '@/components/cards/PostCard';
import { ActivityCard } from '@/components/cards/ActivityCard';
import { OpportunityCard } from '@/components/cards/OpportunityCard';
import { OrgCard } from '@/components/cards/OrgCard';
import { useViewer } from '@/hooks/useViewer';
import { useAppStore } from '@/store/useAppStore';
import { friendsOf } from '@/lib/relations';
import { opportunityScore, daysUntil, isTogetherType } from '@/lib/recommend';
import { relativeTime, todayISO } from '@/lib/format';
import type { Activity, Opportunity, Organization, Post } from '@/types';

const CATS = [
  { key: 'all', label: '추천' }, { key: 'week', label: '이번 주' }, { key: 'activities', label: '활동' }, { key: 'school', label: '학교 소식' }, { key: 'notices', label: '공고' }, { key: 'posts', label: '게시글' }, { key: 'anon', label: '익명' },
] as const;
type Cat = typeof CATS[number]['key'];

type Item =
  | { kind: 'post'; when: string; post: Post }
  | { kind: 'activity'; when: string; activity: Activity; badge?: string }
  | { kind: 'opp'; when: string; opp: Opportunity; reasons?: string[] }
  | { kind: 'notice'; when: string; org: Organization; notice: Organization['notices'][number] };

/** 커뮤니티: 이번 주 행사·친구 활동·학교 소식·공고·게시글(익명 포함)을 한 피드에 */
export function CommunityPage() {
  const nav = useNavigate();
  const status = useAppStore((s) => s.status);
  const error = useAppStore((s) => s.error);
  const init = useAppStore((s) => s.init);
  const orgs = useAppStore((s) => s.organizations);
  const opps = useAppStore((s) => s.opportunities);
  const intents = useAppStore((s) => s.opportunityIntents);
  const v = useViewer();
  const me = v.me;
  const [cat, setCat] = useState<Cat>('all');
  const friendIds = useMemo(() => new Set(friendsOf(v.snap, me.id)), [v.snap, me.id]);
  const mySchool = me.affiliation.type === 'university' ? me.affiliation.schoolId : '';
  const today = todayISO();

  const items = useMemo<Item[]>(() => {
    const out: Item[] = [];
    const scoredOpps = opps.filter((o) => (!o.schoolId || o.schoolId === mySchool) && (!o.deadline || daysUntil(o.deadline) >= 0)).map((o) => ({ o, ...opportunityScore(me, o, intents) }));
    const week = scoredOpps.filter((x) => isTogetherType(x.o.type));
    const notices = scoredOpps.filter((x) => !isTogetherType(x.o.type));
    const acts = v.visibleActivities.filter((a) => a.date >= today && a.hostId !== me.id);
    const official = acts.filter((a) => a.official);
    const friendActs = acts.filter((a) => friendIds.has(a.hostId) || a.kind === 'group');
    const orgNotices = orgs.filter((o) => o.schoolId === mySchool).flatMap((o) => o.notices.map((n) => ({ kind: 'notice' as const, when: n.createdAt, org: o, notice: n })));
    const posts = v.visiblePosts;
    switch (cat) {
      case 'week': week.sort((a, b) => b.score - a.score).forEach((x) => out.push({ kind: 'opp', when: x.o.createdAt, opp: x.o, reasons: x.reasons })); break;
      case 'activities': friendActs.forEach((a) => out.push({ kind: 'activity', when: a.createdAt, activity: a, badge: friendIds.has(a.hostId) ? t('친구') : undefined })); break;
      case 'school': official.forEach((a) => out.push({ kind: 'activity', when: a.createdAt, activity: a, badge: t('학교 공식') })); orgNotices.forEach((n) => out.push(n)); posts.filter((p) => p.authorType === 'org').forEach((p) => out.push({ kind: 'post', when: p.createdAt, post: p })); break;
      case 'notices': notices.sort((a, b) => (a.o.deadline ?? '9').localeCompare(b.o.deadline ?? '9')).forEach((x) => out.push({ kind: 'opp', when: x.o.createdAt, opp: x.o })); break;
      case 'posts': posts.filter((p) => !p.anonymous).forEach((p) => out.push({ kind: 'post', when: p.createdAt, post: p })); break;
      case 'anon': posts.filter((p) => p.anonymous).forEach((p) => out.push({ kind: 'post', when: p.createdAt, post: p })); break;
      default: {
        week.sort((a, b) => b.score - a.score).slice(0, 2).forEach((x) => out.push({ kind: 'opp', when: x.o.createdAt, opp: x.o, reasons: x.reasons }));
        friendActs.slice(0, 3).forEach((a) => out.push({ kind: 'activity', when: a.createdAt, activity: a, badge: friendIds.has(a.hostId) ? t('친구') : undefined }));
        official.slice(0, 1).forEach((a) => out.push({ kind: 'activity', when: a.createdAt, activity: a, badge: t('학교 공식') }));
        orgNotices.slice(0, 2).forEach((n) => out.push(n));
        posts.forEach((p) => out.push({ kind: 'post', when: p.createdAt, post: p }));
      }
    }
    return cat === 'week' || cat === 'notices' ? out : out.sort((a, b) => b.when.localeCompare(a.when));
  }, [cat, opps, intents, v, orgs, friendIds, me, mySchool, today]);

  const noticeCount = opps.filter((o) => !isTogetherType(o.type) && (!o.schoolId || o.schoolId === mySchool) && (!o.deadline || daysUntil(o.deadline) >= 0)).length;

  return (
    <div className="min-h-full pb-6">
      <TopBar title={t('커뮤니티')} bell messages right={<Button size="sm" variant="ghost" icon={<PenSquare size={16} />} onClick={() => nav('/create/post')}>{t('글쓰기')}</Button>} />
      <div className="px-4 pt-1"><ChipRow className="py-0">{CATS.map((c) => <Chip key={c.key} active={cat === c.key} onClick={() => setCat(c.key)}>{c.key === 'anon' ? '🫥 ' : ''}{t(c.label)}</Chip>)}</ChipRow></div>
      {status === 'loading' && <CardSkeleton />}
      {status === 'error' && <ErrorState message={error ?? undefined} onRetry={init} />}
      {status === 'ready' && (
        <div className="px-4 pt-3 space-y-3">
          {cat === 'all' && noticeCount > 0 && (
            <button onClick={() => setCat('notices')} className="w-full rounded-2xl bg-surface border border-line px-3.5 py-2.5 flex items-center gap-2.5 text-left press"><Bell size={15} className="text-gold shrink-0" /><span className="flex-1 text-[12px] text-ink-2 truncate">{lang === 'en' ? `${noticeCount} scholarship, internship and lab notices` : `장학금·인턴·연구실 공고 ${noticeCount}개`}</span><ChevronRight size={15} className="text-ink-3 shrink-0" /></button>
          )}
          {cat === 'anon' && <p className="text-[12px] text-ink-3 px-1">{t('익명 글은 학교명만 보여요. 신고가 접수되면 운영진이 작성자를 확인할 수 있어요.')}</p>}
          {cat === 'school' && orgs.filter((o) => o.schoolId === mySchool).length > 0 && <div className="space-y-2"><h2 className="text-[14px] font-bold">{t('내 학교 동아리·조직')}</h2>{orgs.filter((o) => o.schoolId === mySchool).slice(0, 3).map((o) => <OrgCard key={o.id} org={o} />)}</div>}
          {items.length === 0 ? (
            <EmptyState emoji={cat === 'anon' ? '🫥' : '📝'} title={t('아직 올라온 것이 없어요')} description={cat === 'anon' ? t('첫 익명 글을 남겨보세요.') : t('첫 게시물을 올려보세요.')} action={<Button icon={<PenSquare size={16} />} onClick={() => nav('/create/post')}>{t('게시물 작성')}</Button>} />
          ) : items.map((it) => {
            if (it.kind === 'post') return <PostCard key={`p_${it.post.id}`} post={it.post} />;
            if (it.kind === 'activity') return <ActivityCard key={`a_${it.activity.id}`} activity={it.activity} badge={it.badge} />;
            if (it.kind === 'opp') return <OpportunityCard key={`o_${it.opp.id}`} o={it.opp} reasons={it.reasons} variant={isTogetherType(it.opp.type) ? 'feed' : 'row'} />;
            return (
              <button key={`n_${it.notice.id}`} onClick={() => nav(`/orgs/${it.org.id}`)} className="card w-full p-3.5 flex gap-3 text-left press">
                <Avatar emoji={it.org.logo.emoji} hue={it.org.logo.hue} url={it.org.logo.url} size={40} className="!rounded-xl" />
                <span className="flex-1 min-w-0"><span className="text-[11px] text-ink-3 flex items-center gap-1"><Megaphone size={11} />{it.org.name}{it.org.verified && <BadgeCheck size={11} className="text-gold" />} · {relativeTime(it.notice.createdAt)}</span><b className="text-[14px] block mt-0.5">{it.notice.title}</b><span className="text-[13px] text-ink-2 line-clamp-2">{it.notice.body}</span></span>
                <Tag className="h-5 shrink-0">{t('공지')}</Tag>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
