import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Map, Plus, LayoutGrid, User, Users, CalendarPlus, Megaphone, Image } from 'lucide-react';
import { cn } from '@/lib/cn';
import { BottomSheet } from '@/components/ui';

const items = [
  { to: '/', label: '홈', Icon: Home },
  { to: '/map', label: '지도', Icon: Map },
  { to: '/community', label: '커뮤니티', Icon: LayoutGrid },
  { to: '/profile', label: '프로필', Icon: User },
];

export function BottomNav() {
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const go = (path: string) => { setOpen(false); nav(path); };
  const createOptions = [
    { label: '개인 활동 만들기', desc: '커피, 산책, 스터디처럼 가볍게 함께할 사람 찾기', Icon: CalendarPlus, path: '/create/activity?kind=personal', color: 'bg-primary-soft text-primary' },
    { label: '그룹 모임 만들기', desc: '여러 명이 함께하는 소모임·정기 모임', Icon: Users, path: '/create/activity?kind=group', color: 'bg-mint-soft text-mint' },
    { label: '동아리·학교 행사 만들기', desc: '조직 페이지에 연결되는 공식 행사', Icon: Megaphone, path: '/create/activity?kind=org_event', color: 'bg-gold-soft text-[#B57A0E]' },
    { label: '사진·글 게시물 작성', desc: '커뮤니티에 사진과 글 올리기', Icon: Image, path: '/create/post', color: 'bg-accent-soft text-accent' },
  ];
  return (
    <>
      <nav className="shrink-0 bg-surface border-t border-line safe-bottom">
        <div className="grid grid-cols-5 h-[60px] items-center">
          {items.slice(0, 2).map((it) => <NavItem key={it.to} {...it} />)}
          <div className="grid place-items-center">
            <button onClick={() => setOpen(true)} aria-label="만들기"
              className="-mt-7 h-14 w-14 rounded-full bg-primary text-white grid place-items-center shadow-[var(--shadow-float)] press ring-4 ring-bg">
              <Plus size={28} strokeWidth={2.6} />
            </button>
          </div>
          {items.slice(2).map((it) => <NavItem key={it.to} {...it} />)}
        </div>
      </nav>
      <BottomSheet open={open} onClose={() => setOpen(false)} title="무엇을 만들까요?">
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

function NavItem({ to, label, Icon }: { to: string; label: string; Icon: typeof Home }) {
  return (
    <NavLink to={to} end={to === '/'} className={({ isActive }) => cn('flex flex-col items-center justify-center gap-0.5 h-full text-[10px] font-semibold', isActive ? 'text-primary' : 'text-ink-3')}>
      {({ isActive }) => (<><Icon size={22} strokeWidth={isActive ? 2.4 : 2} />{label}</>)}
    </NavLink>
  );
}
