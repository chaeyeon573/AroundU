import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, Clock, MapPin, Users, Plus, CalendarCheck, Ban, Vote, Lock } from 'lucide-react';
import { t, lang } from '@/i18n';
import { TopBar } from '@/components/layout/TopBar';
import { Avatar, Button, Tag, EmptyState, BottomSheet, Input, Field } from '@/components/ui';
import { useViewer } from '@/hooks/useViewer';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/api';
import { CATEGORY_COLORS, CATEGORY_EMOJI, CATEGORY_LABELS } from '@/lib/labels';
import { tally, myStatusFor, optionLabel, closesIn } from '@/lib/together';
import { addDaysISO, relativeTime } from '@/lib/format';
import { cn } from '@/lib/cn';

/** Plan Together 투표·확정 화면 */
export function TogetherPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const v = useViewer();
  const run = useAppStore((s) => s.run);
  const polls = useAppStore((s) => s.timePolls);
  const poll = polls.find((p) => p.id === id);
  const me = v.me;
  const [sel, setSel] = useState<string[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [custom, setCustom] = useState({ date: addDaysISO(1), startTime: '18:00', endTime: '19:30' });
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (poll) setSel(poll.votes[me.id] ?? []); }, [poll?.id, poll?.votes[me.id]?.length]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!poll) return <div className="min-h-full"><TopBar back title="Plan Together" /><EmptyState emoji="🗳️" title={t('투표를 찾을 수 없어요')} /></div>;
  const isHost = poll.hostId === me.id;
  const invited = isHost || poll.inviteeIds.includes(me.id);
  if (!invited) return <div className="min-h-full"><TopBar back title="Plan Together" /><EmptyState emoji="🔒" title={t('초대받은 사람만 볼 수 있어요')} /></div>;
  const host = v.userById(poll.hostId);
  const { rows, best, voted, total } = tally(poll);
  const myVote = poll.votes[me.id];
  const dirty = JSON.stringify([...sel].sort()) !== JSON.stringify([...(myVote ?? [])].sort());
  const decided = poll.status === 'decided';
  const pending = [poll.hostId, ...poll.inviteeIds].filter((u) => !poll.votes[u]).map((u) => v.userById(u)).filter(Boolean);

  const save = async () => { setBusy(true); try { await run(() => api.together.vote(poll.id, me.id, sel), t('되는 시간을 저장했어요.')); } catch { /* */ } finally { setBusy(false); } };
  const decide = async (optionId: string) => { setBusy(true); try { const res = await run(() => api.together.decide(poll.id, optionId), t('시간을 확정했어요. 활동과 그룹 채팅방이 만들어졌어요.')); nav(`/activities/${res.activity.id}`); } catch { setBusy(false); } };

  return (
    <div className="min-h-full pb-28">
      <TopBar back title="Plan Together" messages />
      <div className="px-4 pt-2 space-y-3">
        <div className="card p-4">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="rounded-lg px-2 h-6 inline-flex items-center text-[11px] font-bold text-white" style={{ background: CATEGORY_COLORS[poll.category] }}>{CATEGORY_EMOJI[poll.category]} {CATEGORY_LABELS[poll.category]}</span>
            {decided ? <Tag tone="mint"><CalendarCheck size={11} /> {t('확정됨')}</Tag> : poll.status === 'cancelled' ? <Tag>{t('취소됨')}</Tag> : <Tag tone="accent"><Vote size={11} /> {closesIn(poll.closesAt)}</Tag>}
          </div>
          <h1 className="text-[20px] font-extrabold leading-snug mt-2">{poll.title}</h1>
          <div className="mt-2 flex items-center gap-2 text-[12px] text-ink-2">
            {host && <button onClick={() => nav(`/users/${host.id}`)} className="flex items-center gap-1.5"><Avatar emoji={host.avatar.emoji} hue={host.avatar.hue} url={host.avatar.url} size={22} />{host.nickname}</button>}
            <span>· {relativeTime(poll.createdAt)}</span>
            {poll.place && <span className="flex items-center gap-0.5"><MapPin size={11} className="text-ink-3" />{poll.place.name}</span>}
          </div>
          <div className="mt-3 flex items-center gap-2 text-[12px]">
            <span className="flex -space-x-1.5">{[poll.hostId, ...poll.inviteeIds].map((uid) => v.userById(uid)).filter(Boolean).map((u) => <Avatar key={u!.id} emoji={u!.avatar.emoji} hue={u!.avatar.hue} url={u!.avatar.url} size={24} className={cn('ring-2 ring-white', !poll.votes[u!.id] && 'opacity-40')} />)}</span>
            <span className="text-ink-2"><Users size={11} className="inline mr-0.5" />{lang === 'en' ? `${voted}/${total} voted` : `${voted}/${total}명 투표`}</span>
            {pending.length > 0 && !decided && <span className="text-ink-3 truncate">· {t('대기')}: {pending.map((u) => u!.nickname).join(', ')}</span>}
          </div>
        </div>

        {decided && poll.activityId && (
          <button onClick={() => nav(`/activities/${poll.activityId}`)} className="card w-full p-3.5 flex items-center gap-3 text-left press bg-[linear-gradient(120deg,#E1F7F0,#FFFFFF)]">
            <span className="h-10 w-10 rounded-xl bg-mint text-white grid place-items-center"><CalendarCheck size={18} /></span>
            <span className="flex-1 text-[13px]"><b>{poll.options.find((o) => o.id === poll.decidedOptionId) ? optionLabel(poll.options.find((o) => o.id === poll.decidedOptionId)!) : ''}</b><br /><span className="text-ink-2">{t('활동과 그룹 채팅방이 만들어졌어요. 열어보기')}</span></span>
          </button>
        )}

        <section>
          <div className="flex items-end justify-between mb-2"><h2 className="text-[15px] font-bold">{isHost && !decided ? t('후보 시간 · 표가 많은 순') : t('되는 시간을 모두 골라주세요')}</h2>{!decided && poll.status === 'open' && <button onClick={() => setAddOpen(true)} className="text-[12px] font-semibold text-primary flex items-center gap-0.5"><Plus size={13} />{t('시간 제안')}</button>}</div>
          <div className="space-y-2">
            {(isHost ? [...rows].sort((a, b) => b.count - a.count) : rows).map(({ option: o, voterIds, count, everyone }) => {
              const on = sel.includes(o.id);
              const st = myStatusFor(me, o);
              const isDecided = poll.decidedOptionId === o.id;
              return (
                <div key={o.id} className={cn('card p-3.5', isDecided && 'ring-2 ring-mint', best?.option.id === o.id && !decided && 'bg-[linear-gradient(120deg,#EEF1FF,#FFFFFF)]')}>
                  <div className="flex items-center gap-3">
                    {!decided && poll.status === 'open' && (
                      <button onClick={() => setSel((s) => on ? s.filter((x) => x !== o.id) : [...s, o.id])} aria-label={optionLabel(o)} className={cn('h-7 w-7 rounded-lg border-2 grid place-items-center shrink-0 press', on ? 'border-primary bg-primary text-white' : 'border-line text-transparent')}><Check size={16} /></button>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-bold flex items-center gap-1.5 flex-wrap"><Clock size={13} className="text-ink-3" />{optionLabel(o)}{o.suggested && <Tag tone="mint" className="h-5">{t('공강 겹침')}</Tag>}{isDecided && <Tag tone="mint" className="h-5">{t('확정')}</Tag>}</div>
                      <div className="mt-1 flex items-center gap-2 text-[12px] text-ink-2">
                        <span className="flex -space-x-1.5">{voterIds.map((uid) => v.userById(uid)).filter(Boolean).slice(0, 6).map((u) => <Avatar key={u!.id} emoji={u!.avatar.emoji} hue={u!.avatar.hue} url={u!.avatar.url} size={20} className="ring-2 ring-white" />)}</span>
                        <span className={cn('font-semibold', everyone && 'text-mint')}>{count}/{total}{everyone ? ` · ${t('모두 가능')}` : ''}</span>
                        {st !== 'unknown' && <span className={cn('text-[11px]', st === 'free' ? 'text-mint' : 'text-ink-3')}>{st === 'free' ? t('내 시간표: 공강') : t('내 시간표: 수업')}</span>}
                      </div>
                    </div>
                    {isHost && !decided && poll.status === 'open' && <Button size="sm" variant={best?.option.id === o.id ? 'primary' : 'outline'} loading={busy} onClick={() => decide(o.id)}>{t('확정')}</Button>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
        <p className="text-[11px] text-ink-3 flex items-start gap-1.5 px-1"><Lock size={12} className="shrink-0 mt-0.5" />{t('전체 시간표는 공유되지 않고, 각자 고른 시간만 보여요. 확정되면 그 시간에 가능하다고 한 사람만 참가자로 초대돼요.')}</p>
        {isHost && !decided && poll.status === 'open' && <button onClick={() => run(() => api.together.cancel(poll.id), t('투표를 취소했어요.'))} className="w-full h-10 text-[12px] font-semibold text-ink-3 flex items-center justify-center gap-1"><Ban size={12} />{t('투표 취소')}</button>}
      </div>

      {!decided && poll.status === 'open' && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-surface/95 backdrop-blur border-t border-line p-3 safe-bottom z-20">
          <Button full size="lg" disabled={!dirty} loading={busy} onClick={save}>{myVote ? (dirty ? t('선택 저장') : t('투표 완료')) : lang === 'en' ? `I can do these ${sel.length}` : `이 ${sel.length}개 시간 돼요`}</Button>
        </div>
      )}
      <BottomSheet open={addOpen} onClose={() => setAddOpen(false)} title={t('시간 제안')}>
        <div className="space-y-3">
          <Field label={t('날짜')}><Input type="date" value={custom.date} onChange={(e) => setCustom({ ...custom, date: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-2"><Field label={t('시작')}><Input type="time" value={custom.startTime} onChange={(e) => setCustom({ ...custom, startTime: e.target.value })} /></Field><Field label={t('종료')}><Input type="time" value={custom.endTime} onChange={(e) => setCustom({ ...custom, endTime: e.target.value })} /></Field></div>
          <Button full disabled={custom.startTime >= custom.endTime} onClick={async () => { await run(() => api.together.addOption(poll.id, me.id, custom), t('시간을 추가했어요.')); setAddOpen(false); }}>{t('추가')}</Button>
        </div>
      </BottomSheet>
    </div>
  );
}
