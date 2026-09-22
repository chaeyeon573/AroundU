import { useMemo } from 'react';
import { t } from '@/i18n';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Bookmark, Sparkles, AlarmClock, Bell } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { Chip, ChipRow, CardSkeleton, EmptyState, ErrorState, Button } from '@/components/ui';
import { OpportunityCard } from '@/components/cards/OpportunityCard';
import { useViewer } from '@/hooks/useViewer';
import { useAppStore } from '@/store/useAppStore';
import { ALL_OPP_TYPES, OPP_TYPE_EMOJI, OPP_TYPE_LABELS, OPP_TYPE_COLORS } from '@/lib/labels';
import { opportunityScore, daysUntil, isTogetherType } from '@/lib/recommend';
import type { OpportunityType } from '@/types';

type Tab = 'foryou' | 'saved' | 'notices' | OpportunityType;

export function OpportunitiesPage() {
  const nav = useNavigate();
  const status = useAppStore((s) => s.status);
  const error = useAppStore((s) => s.error);
  const init = useAppStore((s) => s.init);
  const opps = useAppStore((s) => s.opportunities);
  const intents = useAppStore((s) => s.opportunityIntents);
  const v = useViewer();
  const me = v.me;
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') ?? 'foryou') as Tab;
  const setTab = (tb: Tab) => setParams(tb === 'foryou' ? {} : { tab: tb });
  const mySchool = me.affiliation.type === 'university' ? me.affiliation.schoolId : '';

  const scored = useMemo(() => opps.filter((o) => !o.schoolId || o.schoolId === mySchool).filter((o) => !o.deadline || daysUntil(o.deadline) >= 0)
    .map((o) => ({ o, ...opportunityScore(me, o, intents) })), [opps, intents, me, mySchool]);
  const list = tab === 'foryou' ? [...scored].filter((x) => isTogetherType(x.o.type)).sort((a, b) => b.score - a.score)
    : tab === 'notices' ? scored.filter((x) => !isTogetherType(x.o.type)).sort((a, b) => (a.o.deadline ?? '9').localeCompare(b.o.deadline ?? '9'))
    : tab === 'saved' ? scored.filter((x) => intents.some((i) => i.opportunityId === x.o.id && i.userId === me.id && (i.saved || i.intent !== 'interested')))
    : scored.filter((x) => x.o.type === tab);
  const urgent = scored.filter((x) => x.o.deadline && daysUntil(x.o.deadline) <= 7 && intents.some((i) => i.opportunityId === x.o.id && i.userId === me.id));

  return (
    <div className="min-h-full pb-6">
      <TopBar back title={t('이번 주 뭐 하지?')} bell messages />
      <div className="px-4 pt-1">
        <ChipRow className="py-0">
          <Chip active={tab === 'foryou'} onClick={() => setTab('foryou')}><Sparkles size={13} /> {t('같이 갈래요')}</Chip>
          <Chip active={tab === 'notices'} onClick={() => setTab('notices')}><Bell size={13} /> {t('공고')}</Chip>
          <Chip active={tab === 'saved'} onClick={() => setTab('saved')}><Bookmark size={13} /> {t('내 계획')}</Chip>
          {ALL_OPP_TYPES.filter(isTogetherType).map((ty) => <Chip key={ty} color={OPP_TYPE_COLORS[ty]} active={tab === ty} onClick={() => setTab(ty)}>{OPP_TYPE_EMOJI[ty]} {OPP_TYPE_LABELS[ty]}</Chip>)}
        </ChipRow>
      </div>
      {status === 'loading' && <CardSkeleton />}
      {status === 'error' && <ErrorState message={error ?? undefined} onRetry={init} />}
      {status === 'ready' && (
        <div className="px-4 pt-4 space-y-3">
          {tab === 'foryou' && me.goals.length === 0 && (
            <button onClick={() => nav('/profile/context')} className="card w-full p-3.5 flex items-center gap-3 text-left press bg-[linear-gradient(120deg,#E9EDFF,#FFFFFF)]"><span className="text-2xl">🎯</span><span className="flex-1 text-[13px]"><b>{t('이번 학기 목표를 알려주세요')}</b><br /><span className="text-ink-2">{t('목표와 역할을 설정하면 맞는 기회와 사람을 더 정확히 추천해요.')}</span></span></button>
          )}
          {tab === 'foryou' && urgent.length > 0 && (
            <div className="card p-3.5 bg-[linear-gradient(120deg,#FDE8E9,#FFFFFF)]"><b className="text-[13px] flex items-center gap-1.5"><AlarmClock size={14} className="text-danger" />{t('이번 주 마감')}</b>
              <div className="mt-2 space-y-1">{urgent.map((x) => <button key={x.o.id} onClick={() => nav(`/opportunities/${x.o.id}`)} className="w-full flex justify-between text-[13px] text-left"><span className="truncate">{x.o.title}</span><span className="text-danger font-bold shrink-0 ml-2">D-{daysUntil(x.o.deadline!)}</span></button>)}</div></div>
          )}
          {list.length === 0 ? <EmptyState emoji="🔭" title={tab === 'saved' ? t('저장하거나 지원 예정인 기회가 없어요') : t('아직 등록된 기회가 없어요')} description={tab === 'saved' ? t('관심 있는 기회를 저장하면 마감 전에 알려드려요.') : t('동아리·학생회가 기회를 등록하면 여기에 보여요.')} action={tab === 'saved' ? <Button onClick={() => setTab('foryou')}>{t('기회 둘러보기')}</Button> : undefined} />
            : tab === 'notices' ? <><p className="text-[12px] text-ink-3">{t('장학금·인턴·연구실 공고는 간단히 알려드려요. 저장하면 마감 전에 알림을 보내요.')}</p>{list.map((x) => <OpportunityCard key={x.o.id} o={x.o} variant="row" />)}</>
            : list.map((x) => <OpportunityCard key={x.o.id} o={x.o} reasons={tab === 'foryou' ? x.reasons : undefined} />)}
          <p className="text-[11px] text-ink-3 text-center">{t('마감일은 출처 기준이며 "마지막 확인" 날짜를 상세에서 볼 수 있어요. 잘못된 정보는 신고해주세요.')}</p>
        </div>
      )}
    </div>
  );
}
