import { useState } from 'react';
import { t } from '@/i18n';
import { NavLink, useNavigate } from 'react-router-dom';
import { Plus, LayoutGrid, User, Users, CalendarPlus, Megaphone, Image, Lightbulb, CalendarHeart, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/cn';
import { BottomSheet } from '@/components/ui';

const items = [
  { to: '/', label: t('사람'), Icon: Users },
  { to: '/timetable', label: t('시간표'), Icon: CalendarDays },
  { to: '/community', label: t('커뮤니티'), Icon: LayoutGrid },
  { to: '/profile', label: t('프로필'), Icon: User },
];

export function BottomNav() {
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const go = (path: string) => { setOpen(false); nav(path); };
  const createOptions = [
    { label: t('내 공강 열기'), desc: t('시간표의 빈 시간에 점심·커피·공부 같이할 사람 찾기'), Icon: CalendarHeart, path: '/timetable?open=1', color: 'bg-mint-soft text-mint' },
    { label: t('가볍게 만나기'), desc: t('점심·커피·공부·운동·산책 같이할 사람 찾기'), Icon: CalendarPlus, path: '/create/activity?kind=personal', color: 'bg-primary-soft text-primary' },
    { label: t('팀 만들기'), desc: t('해커톤·창업·스터디·프로젝트 같이할 사람 모으기'), Icon: Lightbulb, path: '/create/activity?kind=group&team=1', color: 'bg-mint-soft text-mint' },
    { label: t('그룹 모임 만들기'), desc: t('여러 명이 함께하는 소모임·정기 모임'), Icon: Users, path: '/create/activity?kind=group', color: 'bg-gold-soft text-[#B57A0E]' },
    { label: t('동아리·학교 행사 만들기'), desc: t('조직 페이지에 연결되는 공식 행사'), Icon: Megaphone, path: '/create/activity?kind=org_event', color: 'bg-surface-2 text-ink-2' },
    { label: t('사진·글 게시물 작성'), desc: t('커뮤니티에 사진과 글 올리기'), Icon: Image, path: '/create/post', color: 'bg-accent-soft text-accent' },
  ];
  return (
    <>
      <nav className="shrink-0 bg-surface border-t border-line safe-bottom">
        <div className="grid grid-cols-5 h-[60px] items-center">
          {items.slice(0, 2).map((it) => <NavItem key={it.to} {...it} />)}
          <div className="grid place-items-center">
            <button onClick={() => setOpen(true)} aria-label={t('만들기')}
              className="-mt-7 h-14 w-14 rounded-full bg-primary text-white grid place-items-center shadow-[var(--shadow-float)] press ring-4 ring-bg">
              <Plus size={28} strokeWidth={2.6} />
            </button>
          </div>
          {items.slice(2).map((it) => <NavItem key={it.to} {...it} />)}
        </div>
      </nav>
      <BottomSheet open={open} onClose={() => setOpen(false)} title={t('무엇을 함께 시작할까요?')}>
        <div className="space-y-2">
          {createOptions.map((o) => (
            <button key={o.path} onClick={() => go(o.path)} className="w-full flex items-center gap-3 rounded-2xl p-3 bg-surface-2 press text-left">
              <span className={cn('h-11 w-11 rounded-xl grid place-items-center shrink-0', o.color)}><o.Icon size={20} /></span>
              <span className="flex-1"><span className="block text-[14px] font-bold">{o.label}</span><span className="block text-[12px] text-ink-3">{o.desc}</span></span>
            </button>
          ))}
        </div>
      </BottomSheet>
    </>
  );
}

function NavItem({ to, label, Icon }: { to: string; label: string; Icon: typeof Users }) {
  return (
    <NavLink to={to} end={to === '/'} className={({ isActive }) => cn('flex flex-col items-center justify-center gap-0.5 h-full text-[10px] font-semibold', isActive ? 'text-primary' : 'text-ink-3')}>
      {({ isActive }) => (<><Icon size={22} strokeWidth={isActive ? 2.4 : 2} />{label}</>)}
    </NavLink>
  );
}
