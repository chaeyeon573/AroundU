import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, MapPin, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/api';

export function WelcomePage() {
  const nav = useNavigate();
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);
  const showToast = useAppStore((s) => s.showToast);
  const [busy, setBusy] = useState(false);

  const login = async () => {
    setBusy(true);
    try {
      const user = await api.auth.loginDemo();
      await setCurrentUser(user);
      nav('/', { replace: true });
    } catch (e) { showToast((e as Error).message, 'error'); setBusy(false); }
  };

  return (
    <div className="min-h-full flex flex-col bg-[linear-gradient(180deg,#EEF1FF_0%,#F6F7FB_45%)]">
      <div className="flex-1 flex flex-col items-center justify-center px-8 pt-16 text-center">
        <div className="relative">
          <div className="h-24 w-24 rounded-[28px] bg-primary grid place-items-center text-white shadow-[var(--shadow-float)]"><MapPin size={46} strokeWidth={2.4} /></div>
          <span className="absolute -right-3 -top-2 h-10 w-10 rounded-2xl bg-white shadow grid place-items-center text-xl">☕</span>
          <span className="absolute -left-4 bottom-0 h-10 w-10 rounded-2xl bg-white shadow grid place-items-center text-xl">📚</span>
        </div>
        <h1 className="mt-8 text-[30px] font-extrabold tracking-tight">AroundU</h1>
        <p className="mt-2 text-[15px] text-ink-2 leading-relaxed">학교와 주변에서 일어나는 활동을 발견하고<br />사람·동아리·모임과 자연스럽게 연결되는 앱</p>
        <div className="mt-8 grid grid-cols-3 gap-2 w-full">
          {[{ Icon: Users, t: '사람', d: '누구와' }, { Icon: Sparkles, t: '활동', d: '무엇을' }, { Icon: MapPin, t: '장소', d: '어디서' }].map((x) => (
            <div key={x.t} className="card p-3 flex flex-col items-center gap-1"><x.Icon size={20} className="text-primary" /><b className="text-[13px]">{x.t}</b><span className="text-[11px] text-ink-3">{x.d}</span></div>
          ))}
        </div>
        <div className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-primary-soft text-primary text-[12px] font-semibold px-3 h-8"><GraduationCap size={14} /> 대학생·대학원생·졸업생을 위한 서비스</div>
      </div>
      <div className="px-6 pb-10 space-y-2.5 safe-bottom">
        <Button full size="lg" onClick={login} loading={busy}>로그인 (데모 계정)</Button>
        <Button full size="lg" variant="outline" onClick={() => nav('/onboarding/basic')}>회원가입</Button>
        <p className="text-center text-[11px] text-ink-3 pt-1">정확한 위치는 다른 사용자에게 절대 공개되지 않아요.</p>
      </div>
    </div>
  );
}
