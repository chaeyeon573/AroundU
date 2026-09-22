import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coffee, Sparkles, Utensils, BookOpen } from 'lucide-react';
import { Avatar, Button, Chip, Toggle } from '@/components/ui';
import { useViewer } from '@/hooks/useViewer';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/api';
import { t, lang } from '@/i18n';
import { whosFree } from '@/lib/social';
import { DAILY_QUESTIONS } from '@/lib/labels';
import { todayISO } from '@/lib/format';
import { toHHMM, nowMin } from '@/lib/timetable';

/** Who's free right now? — 친구·같은 행사·같은 조직·공개 동의한 사람만, 남은 공강 시간만 */
export function WhosFreeSection({ limit = 4, compact }: { limit?: number; compact?: boolean }) {
  const nav = useNavigate();
  const v = useViewer();
  const run = useAppStore((s) => s.run);
  const orgs = useAppStore((s) => s.organizations);
  const me = v.me;
  const snap = useMemo(() => ({ ...v.snap, organizations: orgs }), [v.snap, orgs]);
  const free = useMemo(() => whosFree(snap, me, (u) => v.canSeeField(u, 'timetable')), [snap, me, v]);
  const [showAll, setShowAll] = useState(false);
  const openLunch = () => nav(`/create/activity?kind=personal&cat=meal&start=${toHHMM(Math.max(nowMin() + 30, 12 * 60))}&end=${toHHMM(Math.max(nowMin() + 90, 13 * 60))}`);
  return (
    <section>
      <div className="flex items-end justify-between mb-2"><h2 className="text-[17px] font-bold">{t("Who's free right now?")}</h2><span className="text-[12px] text-ink-3">{free.length}{t('명')}</span></div>
      {free.length === 0 ? <div className="card p-4 text-[13px] text-ink-3">{t('지금 시간이 비는 사람이 없어요. 친구를 추가하거나 새로운 사람에게 공개를 켜보세요.')}</div> : (
        <div className="card divide-y divide-line">
          {(showAll ? free : free.slice(0, limit)).map((p) => (
            <div key={p.u.id} className="flex items-center gap-3 px-3.5 py-3">
              <button onClick={() => nav(`/users/${p.u.id}`)}><Avatar emoji={p.u.avatar.emoji} hue={p.u.avatar.hue} url={p.u.avatar.url} size={42} /></button>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-bold flex items-center gap-1.5">{p.u.nickname}<span className="h-2 w-2 rounded-full bg-mint" /></div>
                <div className="text-[12px] text-ink-2 truncate">{p.status}{p.want ? ` · ${p.want}` : ''}</div>
                <div className="text-[11px] text-ink-3 truncate">{p.why}</div>
              </div>
              <button onClick={() => nav(`/users/${p.u.id}?propose=1&cat=${p.category ?? 'coffee'}`)} className="h-9 px-3 rounded-xl bg-primary-soft text-primary text-[12px] font-bold press flex items-center gap-1"><Coffee size={13} />{p.category === 'meal' ? t('점심 제안') : p.category === 'exercise' ? t('같이 운동') : t('커피 제안')}</button>
            </div>
          ))}
          {free.length > limit && <button onClick={() => setShowAll((s) => !s)} className="w-full h-10 text-[12px] font-semibold text-primary">{showAll ? t('접기') : `${t('더보기')} (${free.length - limit})`}</button>}
        </div>
      )}
      {!compact && (<>
        <div className="flex gap-2 mt-2">
          <Button size="sm" variant="outline" full icon={<Utensils size={14} />} onClick={openLunch}>{t('점심 열기')}</Button>
          <Button size="sm" variant="outline" full icon={<BookOpen size={14} />} onClick={() => nav('/create/activity?kind=personal&cat=study')}>{t('같이 공부하기')}</Button>
          <Button size="sm" variant="outline" full icon={<Coffee size={14} />} onClick={() => nav('/timetable?open=1')}>{t('내 공강 열기')}</Button>
        </div>
        <div className="card mt-2 px-4"><Toggle label={t('새로운 사람에게 공개')} description={t('친구가 아니어도 시간이 맞으면 내가 보여요. 정확한 시간표는 공개되지 않아요.')} checked={!!me.openToNew} onChange={(val) => run(() => api.users.update(me.id, { openToNew: val }))} /></div>
      </>)}
    </section>
  );
}

/** 오늘의 질문 — 답이 곧 행동(제안)으로 이어진다 */
export function DailyQuestionSection() {
  const nav = useNavigate();
  const v = useViewer();
  const run = useAppStore((s) => s.run);
  const me = v.me;
  const q = DAILY_QUESTIONS[0];
  const today = todayISO();
  const myDaily = me.dailyAnswer?.date === today ? me.dailyAnswer : undefined;
  const others = v.visibleUsers.filter((u) => u.dailyAnswer?.date === today && u.dailyAnswer.questionId === q.id);
  return (
    <section className="card p-4 bg-[linear-gradient(120deg,#FFF4DE,#FFFFFF)]">
      <div className="text-[11px] font-bold text-[#B57A0E] flex items-center gap-1"><Sparkles size={12} />{t('오늘의 질문')}</div>
      <h3 className="text-[16px] font-bold mt-1">{q.text}</h3>
      <div className="flex flex-wrap gap-2 mt-3">{q.options.map((o) => <Chip key={o.key} active={myDaily?.answer === o.key} onClick={() => run(() => api.users.update(me.id, { dailyAnswer: { questionId: q.id, answer: o.key, date: today } }), t('답을 친구와 같은 학교 학생에게 가볍게 보여줘요.'))}>{o.label}</Chip>)}</div>
      {others.length > 0 && (
        <div className="mt-3 space-y-1.5">{others.slice(0, 3).map((u) => { const o = q.options.find((x) => x.key === u.dailyAnswer!.answer); return (
          <div key={u.id} className="flex items-center gap-2 text-[12px]"><Avatar emoji={u.avatar.emoji} hue={u.avatar.hue} url={u.avatar.url} size={24} /><span className="flex-1 truncate">{lang === 'en' ? <><b>{u.nickname}</b> would go for <b>{o?.label}</b> if someone asked today.</> : <><b>{u.nickname}</b>{t('님은 오늘 갑자기')} <b>{o?.label}</b> {t('제안이 오면 나갈 수 있어요.')}</>}</span>{o?.category && <button onClick={() => nav(`/users/${u.id}?propose=1&cat=${o.category}`)} className="h-7 px-2.5 rounded-lg bg-white text-[11px] font-bold text-primary press">{o.label} {t('제안')}</button>}</div>
        ); })}</div>
      )}
    </section>
  );
}
