import { useNavigate, useParams } from 'react-router-dom';
import { Users, BookOpen, Plus, Compass, Lock, Clock } from 'lucide-react';
import { t, lang } from '@/i18n';
import { TopBar } from '@/components/layout/TopBar';
import { Avatar, Button, Tag, EmptyState } from '@/components/ui';
import { TeamCard } from '@/components/cards/TeamCard';
import { useViewer } from '@/hooks/useViewer';
import { classmates } from '@/lib/relations';
import { DAY_LABELS } from '@/lib/timetable';
import { todayISO } from '@/lib/format';
import { matchReasons } from '@/lib/recommend';

/** 수업 공간 — 같은 수업을 듣는 학생과 운영 중인 Study Crew. 시간표 시트와 /classes/:courseName 페이지가 함께 쓴다 */
export function ClassSpaceContent({ courseName, onEdit, onClose }: { courseName: string; onEdit?: () => void; onClose?: () => void }) {
  const nav = useNavigate();
  const v = useViewer();
  const me = v.me;
  const mine = me.timetable.filter((c) => c.name === courseName);
  const mates = classmates(v.snap, me, courseName, (u) => v.canSeeField(u, 'timetable'));
  const hidden = v.visibleUsers.filter((u) => u.affiliation.type === 'university' && me.affiliation.type === 'university' && u.affiliation.schoolId === me.affiliation.schoolId && u.timetable.some((c) => c.name === courseName) && !mates.includes(u)).length;
  const crews = v.visibleActivities.filter((a) => a.courseName === courseName && a.date >= todayISO());
  const go = (p: string) => { onClose?.(); nav(p); };
  const times = mine.map((c) => `${DAY_LABELS[c.day]} ${c.start}–${c.end}`).join(' · ');
  return (
    <div className="space-y-4">
      {mine.length > 0 && <div className="text-[12px] text-ink-3 flex items-center gap-1"><Clock size={12} />{times}{mine[0].room && <span className="flex items-center gap-0.5 ml-1"><Lock size={10} />{mine[0].room}</span>}</div>}
      <div className="flex gap-2">
        <Button full icon={<Plus size={15} />} onClick={() => go(`/create/activity?crew=${encodeURIComponent(courseName)}`)}>{t('Study Crew 만들기')}</Button>
        <Button full variant="outline" icon={<Compass size={15} />} onClick={() => go('/discover?tab=teams')}>{t('참여 가능한 Crew')}</Button>
      </div>
      <section>
        <h3 className="text-[14px] font-bold flex items-center gap-1.5 mb-2"><BookOpen size={15} className="text-primary" />{t('운영 중인 Study Crew')} <span className="text-[12px] text-ink-3 font-semibold">{crews.length}</span></h3>
        {crews.length === 0 ? <div className="card px-4 py-3 text-[12px] text-ink-3">{t('아직 없어요. 시험·과제·팀플 중 하나로 첫 Crew를 열어보세요. 같은 수업 학생에게만 보여요.')}</div> : <div className="space-y-2">{crews.map((a) => <TeamCard key={a.id} activity={a} />)}</div>}
      </section>
      <section>
        <h3 className="text-[14px] font-bold flex items-center gap-1.5 mb-2"><Users size={15} className="text-primary" />{lang === 'en' ? `${mates.length} students in this class` : `같은 수업 듣는 학생 ${mates.length}명`}</h3>
        {mates.length === 0 ? <div className="card px-4 py-3 text-[12px] text-ink-3">{t('시간표를 공개한 같은 수업 학생이 아직 없어요.')}</div> : (
          <div className="card divide-y divide-line">{mates.map((u) => { const r = matchReasons(me, u, v.snap, true).filter((x) => x.kind !== 'class' && x.kind !== 'school')[0]; return (
            <button key={u.id} onClick={() => go(`/users/${u.id}`)} className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left press">
              <Avatar emoji={u.avatar.emoji} hue={u.avatar.hue} url={u.avatar.url} size={36} />
              <span className="flex-1 min-w-0"><b className="text-[13px]">{u.nickname}</b>{v.isFriend(u.id) && <Tag tone="mint" className="h-5 ml-1.5">{t('친구')}</Tag>}<span className="block text-[11px] text-ink-3 truncate">{r?.text ?? (u.affiliation.type === 'university' && u.affiliation.showDepartment ? u.affiliation.department : '')}</span></span>
              <span className="text-[12px] font-semibold text-primary">{t('제안')}</span>
            </button>
          ); })}</div>
        )}
        {hidden > 0 && <p className="text-[11px] text-ink-3 mt-1.5 flex items-center gap-1"><Lock size={10} />{lang === 'en' ? `${hidden} more keep their timetable private.` : `시간표를 비공개한 학생 ${hidden}명은 표시되지 않아요.`}</p>}
      </section>
      {onEdit && <button onClick={onEdit} className="w-full h-10 text-[12px] font-semibold text-ink-3">{t('수업 정보 수정')}</button>}
    </div>
  );
}

export function ClassPage() {
  const { courseName = '' } = useParams();
  const name = decodeURIComponent(courseName);
  const v = useViewer();
  const has = v.me.timetable.some((c) => c.name === name);
  return (
    <div className="min-h-full pb-8">
      <TopBar back title={name} messages />
      <div className="px-4 pt-2">
        {!has ? <EmptyState emoji="📚" title={t('내 시간표에 없는 수업이에요')} description={t('시간표에 수업을 추가하면 같은 수업 학생과 Study Crew를 볼 수 있어요.')} /> : <ClassSpaceContent courseName={name} />}
      </div>
    </div>
  );
}
