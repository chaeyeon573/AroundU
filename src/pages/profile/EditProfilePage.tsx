import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '@/components/layout/TopBar';
import { Button, Chip, Field, Input, Textarea, Toggle, VisibilityPicker, Segmented } from '@/components/ui';
import { useViewer } from '@/hooks/useViewer';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/api';
import { ALL_AVAILABILITY, ALL_INTERESTS, ALL_PURPOSES, AVAILABILITY_LABELS, INTEREST_EMOJI, INTEREST_LABELS, PURPOSE_LABELS } from '@/lib/labels';
import type { Availability, Interest, ProfileField, Purpose, User } from '@/types';
import { cn } from '@/lib/cn';

const EMOJIS = ['🙂', '😎', '🧑‍💻', '👩‍🎨', '🧑‍🔬', '🏃', '🎸', '📚', '🌱', '🎨', '🚀', '🧗', '☕', '🐱', '🦊', '🎧'];

export function EditProfilePage() {
  const nav = useNavigate();
  const v = useViewer();
  const run = useAppStore((s) => s.run);
  const me = v.me;
  const [form, setForm] = useState<User>(() => structuredClone(me));
  const [busy, setBusy] = useState(false);
  const patch = (p: Partial<User>) => setForm((f) => ({ ...f, ...p }));
  const toggle = <T,>(arr: T[], x: T) => (arr.includes(x) ? arr.filter((i) => i !== x) : [...arr, x]);
  const fv = (k: ProfileField) => <VisibilityPicker compact value={form.fieldVisibility[k]} onChange={(vis) => patch({ fieldVisibility: { ...form.fieldVisibility, [k]: vis } })} />;
  const aff = form.affiliation.type === 'university' ? form.affiliation : null;

  const save = async () => {
    setBusy(true);
    try {
      const { id: _id, createdAt: _c, ...rest } = form;
      await run(() => api.users.update(me.id, rest), '프로필을 저장했어요.');
      nav('/profile', { replace: true });
    } catch { setBusy(false); }
  };

  return (
    <div className="min-h-full pb-28">
      <TopBar back title="프로필 편집" />
      <div className="px-4 py-4 space-y-5">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-3xl grid place-items-center text-4xl shrink-0" style={{ background: `linear-gradient(135deg, hsl(${form.avatar.hue} 85% 88%), hsl(${(form.avatar.hue + 40) % 360} 80% 74%))` }}>{form.avatar.emoji}</div>
          <div className="flex-1">
            <Segmented value={form.avatar.photoType} onChange={(t) => patch({ avatar: { ...form.avatar, photoType: t } })} options={[{ value: 'face', label: '얼굴' }, { value: 'masked', label: '가면' }, { value: 'back', label: '뒷모습' }]} />
            <input type="range" min={0} max={359} value={form.avatar.hue} onChange={(e) => patch({ avatar: { ...form.avatar, hue: Number(e.target.value) } })} className="w-full mt-2 accent-primary" aria-label="배경 색상" />
          </div>
        </div>
        <div className="grid grid-cols-8 gap-1.5">{EMOJIS.map((e) => <button key={e} type="button" onClick={() => patch({ avatar: { ...form.avatar, emoji: e } })} className={cn('h-10 rounded-xl text-xl', form.avatar.emoji === e ? 'bg-primary-soft ring-2 ring-primary' : 'bg-surface-2')}>{e}</button>)}</div>
        <Field label="닉네임" required><Input value={form.nickname} onChange={(e) => patch({ nickname: e.target.value })} maxLength={12} /></Field>
        <Field label="지금 하고 싶은 활동 (한 줄)" hint="홈 추천 카드에 표시돼요"><Input placeholder="예: 오늘 저녁 신촌에서 커피 한 잔?" value={form.nowWant ?? ''} onChange={(e) => patch({ nowWant: e.target.value })} /></Field>
        <Field label="자기소개" right={fv('bio')}><Textarea value={form.bio} onChange={(e) => patch({ bio: e.target.value })} maxLength={200} /></Field>
        <Field label="좋아하는 것" right={fv('likes')}><Input value={form.likes} onChange={(e) => patch({ likes: e.target.value })} /></Field>
        <Field label="자유시간에 하고 싶은 활동" right={fv('freeTime')}><Input value={form.freeTime} onChange={(e) => patch({ freeTime: e.target.value })} /></Field>
        <Field label="관심사" right={fv('interests')}><div className="flex flex-wrap gap-2">{ALL_INTERESTS.map((i) => <Chip key={i} active={form.interests.includes(i)} onClick={() => patch({ interests: toggle(form.interests, i) as Interest[] })}>{INTEREST_EMOJI[i]} {INTEREST_LABELS[i]}</Chip>)}</div></Field>
        <Field label="이용 목적" right={fv('purposes')}><div className="flex flex-wrap gap-2">{ALL_PURPOSES.map((p) => <Chip key={p} active={form.purposes.includes(p)} onClick={() => patch({ purposes: toggle(form.purposes, p) as Purpose[] })}>{PURPOSE_LABELS[p]}</Chip>)}</div></Field>
        <Field label="활동 가능한 시간" right={fv('availability')}><div className="flex flex-wrap gap-2">{ALL_AVAILABILITY.map((a) => <Chip key={a} active={form.availability === a} onClick={() => patch({ availability: a as Availability })}>{AVAILABILITY_LABELS[a]}</Chip>)}</div></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="키 (선택)" right={fv('height')}><Input type="number" placeholder="cm" value={form.height ?? ''} onChange={(e) => patch({ height: e.target.value ? Number(e.target.value) : undefined })} /></Field>
          <Field label="지역"><Input value={form.region} onChange={(e) => patch({ region: e.target.value })} /></Field>
        </div>
        <Field label="관심 있는 사람의 조건 (선택)" right={fv('preferredPartner')}><Input value={form.preferredPartner ?? ''} onChange={(e) => patch({ preferredPartner: e.target.value })} /></Field>
        {aff && (
          <div className="card px-4 divide-y divide-line">
            <div className="py-3"><b className="text-[13px]">학교 정보</b><div className="text-[12px] text-ink-3">{aff.schoolName} · {aff.department} · {aff.emailVerified ? '학교 인증 완료' : '미인증'}</div></div>
            <Toggle label="학교명 공개" checked={aff.showSchool} onChange={(val) => patch({ affiliation: { ...aff, showSchool: val } })} />
            <Toggle label="학과 공개" checked={aff.showDepartment} onChange={(val) => patch({ affiliation: { ...aff, showDepartment: val } })} />
            {!aff.emailVerified && <div className="py-3"><Button size="sm" variant="secondary" onClick={() => patch({ affiliation: { ...aff, emailVerified: true } })}>학교 이메일 인증하기 (데모: 즉시 완료)</Button></div>}
          </div>
        )}
        <div className="card px-4"><Toggle label="본인 인증" description={form.identityVerified ? '인증 완료 — 프로필에 배지가 표시돼요' : '데모에서는 토글로 인증 상태를 바꿀 수 있어요'} checked={form.identityVerified} onChange={(val) => patch({ identityVerified: val })} /></div>
      </div>
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-surface/95 backdrop-blur border-t border-line p-3 safe-bottom z-20"><Button full size="lg" loading={busy} disabled={form.nickname.trim().length < 2} onClick={save}>저장</Button></div>
    </div>
  );
}
