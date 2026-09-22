import { useState } from 'react';
import { t } from '@/i18n';
import { useNavigate } from 'react-router-dom';
import { Plus, X } from 'lucide-react';
import type { PostInput } from '@/api';
import { TopBar } from '@/components/layout/TopBar';
import { Button, Field, Input, Textarea, Select, VisibilityList, Cover } from '@/components/ui';
import { useViewer } from '@/hooks/useViewer';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/api';
import { cn } from '@/lib/cn';

const EMOJIS = ['📷', '☕', '🍜', '📚', '🏃', '🎸', '🎨', '🌅', '🐈', '🎤', '💻', '🌸'];

export function CreatePostPage() {
  const nav = useNavigate();
  const v = useViewer();
  const run = useAppStore((s) => s.run);
  const orgs = useAppStore((s) => s.organizations);
  const myOrgs = orgs.filter((o) => o.adminIds.includes(v.me.id));
  const myActs = v.visibleActivities.filter((a) => a.hostId === v.me.id || v.myParticipation(a.id)?.status === 'approved');
  const [form, setForm] = useState<PostInput>({ text: '', media: [{ emoji: '📷', hue: 210 }], tags: [], visibility: 'school', relatedActivityId: undefined, orgId: undefined });
  const [tagInput, setTagInput] = useState('');
  const [busy, setBusy] = useState(false);
  const patch = (p: Partial<PostInput>) => setForm((f) => ({ ...f, ...p }));

  const submit = async () => {
    setBusy(true);
    try { await run(() => api.posts.create(v.me.id, form), t('게시물을 올렸어요.')); nav('/community', { replace: true }); } catch { setBusy(false); }
  };

  return (
    <div className="min-h-full pb-28">
      <TopBar back title={t('게시물 작성')} />
      <div className="px-4 py-4 space-y-5">
        <Field label={t('사진')} hint={t('데모에서는 이모지 카드로 사진을 대체해요. 여러 장 추가할 수 있어요.')}>
          <div className="flex gap-2 overflow-x-auto hide-scrollbar">
            {form.media.map((m, i) => (
              <div key={i} className="relative shrink-0"><Cover emoji={m.emoji} hue={m.hue} className="h-24 w-24 rounded-2xl" size={36} />
                {form.media.length > 1 && <button onClick={() => patch({ media: form.media.filter((_, j) => j !== i) })} className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-ink text-white grid place-items-center"><X size={12} /></button>}</div>
            ))}
            {form.media.length < 5 && <button onClick={() => patch({ media: [...form.media, { emoji: EMOJIS[form.media.length % EMOJIS.length], hue: (form.media.length * 70 + 30) % 360 }] })} className="h-24 w-24 rounded-2xl border-2 border-dashed border-line grid place-items-center text-ink-3 shrink-0"><Plus size={22} /></button>}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">{EMOJIS.map((e) => <button key={e} onClick={() => patch({ media: form.media.map((m, i) => (i === form.media.length - 1 ? { ...m, emoji: e } : m)) })} className={cn('h-9 w-9 rounded-lg text-lg', form.media[form.media.length - 1]?.emoji === e ? 'bg-primary-soft ring-2 ring-primary' : 'bg-surface-2')}>{e}</button>)}</div>
        </Field>
        <Field label={t('내용')} required><Textarea placeholder={t('무슨 일이 있었나요?')} value={form.text} onChange={(e) => patch({ text: e.target.value })} maxLength={500} /></Field>
        <Field label={t('태그')}>
          <div className="flex gap-2"><Input placeholder={t('태그 입력 후 추가')} value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (tagInput.trim()) { patch({ tags: [...form.tags, tagInput.trim().replace(/^#/, '')] }); setTagInput(''); } } }} /><Button variant="secondary" onClick={() => { if (tagInput.trim()) { patch({ tags: [...form.tags, tagInput.trim().replace(/^#/, '')] }); setTagInput(''); } }}>{t('추가')}</Button></div>
          {form.tags.length > 0 && <div className="flex flex-wrap gap-1.5 mt-2">{form.tags.map((t, i) => <button key={i} onClick={() => patch({ tags: form.tags.filter((_, j) => j !== i) })} className="rounded-lg bg-primary-soft text-primary text-[12px] font-semibold px-2 h-7 flex items-center gap-1">#{t}<X size={11} /></button>)}</div>}
        </Field>
        <Field label={t('관련 활동 (선택)')} hint={t('연결하면 게시물에 \'이 활동에 참여하기\' 버튼이 표시돼요.')}>
          <Select value={form.relatedActivityId ?? ''} onChange={(e) => patch({ relatedActivityId: e.target.value || undefined })}><option value="">{t('연결 안 함')}</option>{myActs.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}</Select>
        </Field>
        {myOrgs.length > 0 && <Field label={t('조직 이름으로 게시')}><Select value={form.orgId ?? ''} onChange={(e) => patch({ orgId: e.target.value || undefined })}><option value="">{t('내 이름으로')}</option>{myOrgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</Select></Field>}
        <Field label={t('공개 범위')} required><VisibilityList value={form.visibility} options={['public', 'school', 'friends']} onChange={(vis) => patch({ visibility: vis })} /></Field>
      </div>
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-surface/95 backdrop-blur border-t border-line p-3 safe-bottom z-20">
        <Button full size="lg" disabled={!form.text.trim()} loading={busy} onClick={submit}>{t('게시하기')}</Button>
      </div>
    </div>
  );
}
