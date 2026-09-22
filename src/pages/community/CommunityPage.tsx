import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PenSquare, Bookmark, Sparkles, AlarmClock, Bell, Link2 } from 'lucide-react';
import { t } from '@/i18n';
import { TopBar } from '@/components/layout/TopBar';
import { Chip, ChipRow, Button, CardSkeleton, EmptyState, ErrorState, Segmented } from '@/components/ui';
import { PostCard } from '@/components/cards/PostCard';
import { OpportunityCard } from '@/components/cards/OpportunityCard';
import { OrgCard } from '@/components/cards/OrgCard';
import { ShareOpportunitySheet } from '@/components/create/ShareOpportunitySheet';
import { useViewer } from '@/hooks/useViewer';
import { useAppStore } from '@/store/useAppStore';
import { opportunityScore, daysUntil, isTogetherType } from '@/lib/recommend';
import { ALL_OPP_TYPES, OPP_TYPE_EMOJI, OPP_TYPE_LABELS, OPP_TYPE_COLORS, ALL_POST_TYPES, POST_TYPE_LABELS, POST_TYPE_EMOJI, TOPIC_TAGS } from '@/lib/labels';
import type { OpportunityType, OrganizationType, PostType } from '@/types';

type Tab = 'feed' | 'opportunities' | 'clubs';

/** 커뮤니티: 학교에 어떤 이야기·기회·조직이 있는가 (Feed | Opportunities | Clubs) */
export function CommunityPage() {
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') ?? 'feed') as Tab;
  const setTab = (tb: Tab) => setParams(tb === 'feed' ? {} : { tab: tb }, { replace: true });
  const status = useAppStore((s) => s.status);
  const error = useAppStore((s) => s.error);
  const init = useAppStore((s) => s.init);
  const [share, setShare] = useState(false);
  return (
    <div className="min-h-full pb-6">
      <TopBar title={t('커뮤니티')} bell messages right={tab === 'opportunities' ? <Button size="sm" variant="ghost" icon={<Link2 size={16} />} onClick={() => setShare(true)}>{t('공유')}</Button> : <Button size="sm" variant="ghost" icon={<PenSquare size={16} />} onClick={() => nav('/create/post')}>{t('글쓰기')}</Button>} />
      <div className="px-4 pt-1"><Segmented value={tab} onChange={setTab} options={[{ value: 'feed', label: 'Feed' }, { value: 'opportunities', label: t('기회') }, { value: 'clubs', label: 'Clubs' }]} /></div>
      {status === 'loading' && <CardSkeleton />}
      {status === 'error' && <ErrorState message={error ?? undefined} onRetry={init} />}
      {status === 'ready' && (
        <div className="px-4 pt-3">
          {tab === 'feed' && <FeedTab />}
          {tab === 'opportunities' && <OpportunitiesTab />}
          {tab === 'clubs' && <ClubsTab />}
        </div>
      )}
      <ShareOpportunitySheet open={share} onClose={() => setShare(false)} />
    </div>
  );
}

function FeedTab() {
  const nav = useNavigate();
  const v = useViewer();
  const [type, setType] = useState<PostType | 'all' | 'anon'>('all');
  const [topic, setTopic] = useState('all');
  const posts = v.visiblePosts.filter((p) => p.showOnFeed !== false)
    .filter((p) => type === 'all' ? true : type === 'anon' ? p.anonymous : p.postType === type && !p.anonymous)
    .filter((p) => topic === 'all' || p.topics?.includes(topic))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return (
    <div className="space-y-3">
      <ChipRow className="py-0"><Chip size="sm" active={type === 'all'} onClick={() => setType('all')}>{t('전체')}</Chip>{ALL_POST_TYPES.map((pt) => <Chip key={pt} size="sm" active={type === pt} onClick={() => setType(pt)}>{POST_TYPE_EMOJI[pt]} {POST_TYPE_LABELS[pt]}</Chip>)}<Chip size="sm" active={type === 'anon'} onClick={() => setType('anon')}>🫥 {t('익명')}</Chip></ChipRow>
      <ChipRow className="py-0 -mt-1"><Chip size="sm" active={topic === 'all'} onClick={() => setTopic('all')}>#{t('모든 주제')}</Chip>{TOPIC_TAGS.map((tg) => <Chip key={tg.key} size="sm" active={topic === tg.key} onClick={() => setTopic(tg.key)}>#{tg.label}</Chip>)}</ChipRow>
      {type === 'anon' && <p className="text-[12px] text-ink-3 px-1">{t('익명 글은 텍스트만 올릴 수 있고 학교명만 보여요. 신고가 접수되면 운영진이 작성자를 확인할 수 있어요.')}</p>}
      {posts.length === 0 ? (
        <EmptyState emoji={type === 'anon' ? '🫥' : '📝'} title={t('아직 올라온 것이 없어요')} description={t('첫 게시물을 올려보세요. 사진은 캠퍼스 생활과 활동 중심으로.')} action={<Button icon={<PenSquare size={16} />} onClick={() => nav(`/create/post${type === 'anon' ? '?anon=1' : type !== 'all' ? `?type=${type}` : ''}`)}>{t('게시물 작성')}</Button>} />
      ) : posts.map((p) => <PostCard key={p.id} post={p} />)}
    </div>
  );
}

type Sub = 'foryou' | 'saved' | 'notices' | OpportunityType;
function OpportunitiesTab() {
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();
  const sub = (params.get('sub') ?? 'foryou') as Sub;
  const setSub = (s: Sub) => setParams(s === 'foryou' ? { tab: 'opportunities' } : { tab: 'opportunities', sub: s }, { replace: true });
  const opps = useAppStore((s) => s.opportunities);
  const intents = useAppStore((s) => s.opportunityIntents);
  const v = useViewer();
  const me = v.me;
  const mySchool = me.affiliation.type === 'university' ? me.affiliation.schoolId : '';
  const scored = useMemo(() => opps.filter((o) => !o.schoolId || o.schoolId === mySchool).filter((o) => !o.deadline || daysUntil(o.deadline) >= 0)
    .map((o) => ({ o, ...opportunityScore(me, o, intents) })), [opps, intents, me, mySchool]);
  const list = sub === 'foryou' ? [...scored].filter((x) => isTogetherType(x.o.type)).sort((a, b) => b.score - a.score)
    : sub === 'notices' ? scored.filter((x) => !isTogetherType(x.o.type)).sort((a, b) => (a.o.deadline ?? '9').localeCompare(b.o.deadline ?? '9'))
    : sub === 'saved' ? scored.filter((x) => intents.some((i) => i.opportunityId === x.o.id && i.userId === me.id && (i.saved || i.intent !== 'interested')))
    : scored.filter((x) => x.o.type === sub);
  const urgent = scored.filter((x) => x.o.deadline && daysUntil(x.o.deadline) <= 7 && intents.some((i) => i.opportunityId === x.o.id && i.userId === me.id));
  return (
    <div className="space-y-3">
      <ChipRow className="py-0">
        <Chip size="sm" active={sub === 'foryou'} onClick={() => setSub('foryou')}><Sparkles size={13} /> {t('나에게 맞는')}</Chip>
        <Chip size="sm" active={sub === 'notices'} onClick={() => setSub('notices')}><Bell size={13} /> {t('공고')}</Chip>
        <Chip size="sm" active={sub === 'saved'} onClick={() => setSub('saved')}><Bookmark size={13} /> {t('저장·지원')}</Chip>
        {ALL_OPP_TYPES.filter((ty) => ty !== 'activity').map((ty) => <Chip key={ty} size="sm" color={OPP_TYPE_COLORS[ty]} active={sub === ty} onClick={() => setSub(ty)}>{OPP_TYPE_EMOJI[ty]} {OPP_TYPE_LABELS[ty]}</Chip>)}
      </ChipRow>
      {sub === 'foryou' && me.goals.length === 0 && (
        <button onClick={() => nav('/profile/context')} className="card w-full p-3.5 flex items-center gap-3 text-left press bg-[linear-gradient(120deg,#E9EDFF,#FFFFFF)]"><span className="text-2xl">🎯</span><span className="flex-1 text-[13px]"><b>{t('이번 학기 목표를 알려주세요')}</b><br /><span className="text-ink-2">{t('목표와 역할을 설정하면 맞는 기회와 사람을 더 정확히 추천해요.')}</span></span></button>
      )}
      {sub === 'foryou' && urgent.length > 0 && (
        <div className="card p-3.5 bg-[linear-gradient(120deg,#FDE8E9,#FFFFFF)]"><b className="text-[13px] flex items-center gap-1.5"><AlarmClock size={14} className="text-danger" />{t('이번 주 마감')}</b>
          <div className="mt-2 space-y-1">{urgent.map((x) => <button key={x.o.id} onClick={() => nav(`/opportunities/${x.o.id}`)} className="w-full flex justify-between text-[13px] text-left"><span className="truncate">{x.o.title}</span><span className="text-danger font-bold shrink-0 ml-2">D-{daysUntil(x.o.deadline!)}</span></button>)}</div></div>
      )}
      {list.length === 0 ? <EmptyState emoji="🔭" title={sub === 'saved' ? t('저장하거나 지원 예정인 기회가 없어요') : t('아직 등록된 기회가 없어요')} description={sub === 'saved' ? t('관심 있는 기회를 저장하면 마감 전에 알려드려요.') : t('링크만 있으면 누구나 기회를 공유할 수 있어요.')} action={sub === 'saved' ? <Button onClick={() => setSub('foryou')}>{t('기회 둘러보기')}</Button> : undefined} />
        : sub === 'notices' ? <><p className="text-[12px] text-ink-3">{t('장학금·인턴·연구실 공고는 간단히 알려드려요. 저장하면 마감 전에 알림을 보내요.')}</p>{list.map((x) => <OpportunityCard key={x.o.id} o={x.o} variant="row" />)}</>
        : list.map((x) => <OpportunityCard key={x.o.id} o={x.o} reasons={sub === 'foryou' ? x.reasons : undefined} variant={isTogetherType(x.o.type) ? 'feed' : 'row'} />)}
    </div>
  );
}

const CLUB_CHIPS: { key: OrganizationType | 'all' | 'mine'; label: string }[] = [
  { key: 'all', label: t('전체') }, { key: 'mine', label: t('내 조직') }, { key: 'club', label: t('동아리') }, { key: 'council', label: t('학회·학생회') }, { key: 'lab', label: t('연구실') }, { key: 'greek', label: 'Greek' }, { key: 'department', label: t('학과') },
];
function ClubsTab() {
  const [params] = useSearchParams();
  const v = useViewer();
  const orgs = useAppStore((s) => s.organizations);
  const [chip, setChip] = useState<typeof CLUB_CHIPS[number]['key']>(params.get('mine') ? 'mine' : 'all');
  const mySchool = v.me.affiliation.type === 'university' ? v.me.affiliation.schoolId : '';
  const mine = (o: typeof orgs[number]) => o.memberIds.includes(v.me.id) || o.adminIds.includes(v.me.id) || o.followerIds.includes(v.me.id);
  const list = orgs.filter((o) => chip === 'mine' ? mine(o) : (o.schoolId === mySchool || mine(o)) && (chip === 'all' || o.type === chip))
    .sort((a, b) => Number(!!b.recruitment?.open) - Number(!!a.recruitment?.open) || b.followerIds.length - a.followerIds.length);
  return (
    <div className="space-y-3">
      <ChipRow className="py-0">{CLUB_CHIPS.map((c) => <Chip key={c.key} size="sm" active={chip === c.key} onClick={() => setChip(c.key)}>{c.label}</Chip>)}</ChipRow>
      {list.length === 0 ? <EmptyState emoji="🏛️" title={t('아직 조직이 없어요')} description={chip === 'mine' ? t('동아리를 팔로우하거나 가입하면 여기에 모여요.') : t('동아리·학회가 페이지를 만들면 여기에 보여요.')} />
        : list.map((o) => <OrgCard key={o.id} org={o} />)}
    </div>
  );
}
