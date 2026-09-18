import { useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { TILES_ENABLED, TILE_URL, LandmarkLayer } from '@/pages/map/MapPage';
import { MapPin } from 'lucide-react';
import type { ActivityInput } from '@/api';
import type { ActivityCategory, ActivityKind, JoinPolicy, Visibility } from '@/types';
import { TopBar } from '@/components/layout/TopBar';
import { Button, Chip, Field, Input, Textarea, Select, VisibilityList, EmptyState, Avatar } from '@/components/ui';
import { useViewer } from '@/hooks/useViewer';
import { useAppStore } from '@/store/useAppStore';
import { api } from '@/api';
import { ALL_CATEGORIES, CATEGORY_COLORS, CATEGORY_EMOJI, CATEGORY_LABELS, JOIN_POLICY_LABELS, KIND_LABELS } from '@/lib/labels';
import { PLACE_PRESETS } from '@/data/places';
import { todayISO } from '@/lib/format';
import { friendsOf } from '@/lib/relations';
import { cn } from '@/lib/cn';

const COVER_HUES = [30, 220, 135, 285, 15, 175, 355, 100, 50, 235];

export function CreateActivityPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const v = useViewer();
  const run = useAppStore((s) => s.run);
  const orgs = useAppStore((s) => s.organizations);
  const editing = id ? v.visibleActivities.find((a) => a.id === id) : undefined;
  const kind = (editing?.kind ?? (params.get('kind') as ActivityKind) ?? 'personal') as ActivityKind;
  const schoolId = v.me.affiliation.type === 'university' ? v.me.affiliation.schoolId : 's_yonsei';
  const presets = PLACE_PRESETS[schoolId] ?? PLACE_PRESETS.s_yonsei;
  const myOrgs = orgs.filter((o) => o.adminIds.includes(v.me.id) || o.memberIds.includes(v.me.id));
  const friends = useMemo(() => friendsOf(v.snap, v.me.id).map((fid) => v.userById(fid)!).filter(Boolean), [v]);

  const [form, setForm] = useState<ActivityInput>(() => editing ? { ...editing } : {
    kind, category: kind === 'org_event' ? 'club' : 'coffee', title: '', description: '', cover: { emoji: '☕', hue: 30 },
    date: todayISO(), startTime: '18:00', endTime: '19:30', place: presets[0], capacity: kind === 'personal' ? 4 : 10, fee: 0, conditions: '',
    joinPolicy: kind === 'personal' ? 'open' : 'approval', visibility: 'school', visibilityTargets: [], invitedIds: [], orgId: kind === 'org_event' ? myOrgs[0]?.id : undefined,
  });
  const patch = (p: Partial<ActivityInput>) => setForm((f) => ({ ...f, ...p }));
  const setCategory = (c: ActivityCategory) => patch({ category: c, cover: { emoji: CATEGORY_EMOJI[c], hue: form.cover.hue } });
  const [busy, setBusy] = useState(false);
  const [customPlace, setCustomPlace] = useState(false);

  if (id && !editing) return <div className="min-h-full"><TopBar back title="활동 수정" /><EmptyState emoji="🔒" title="수정할 수 없는 활동이에요" /></div>;
  if (editing && editing.hostId !== v.me.id) return <div className="min-h-full"><TopBar back title="활동 수정" /><EmptyState emoji="🔒" title="주최자만 수정할 수 있어요" /></div>;

  const valid = form.title.trim().length >= 2 && form.description.trim().length > 0 && form.place.name && form.capacity > 0 && form.startTime < form.endTime;
  const preview = `${form.date === todayISO() ? '오늘' : form.date} ${form.startTime} ${form.place.name}에서 ${form.title || '…'}`;

  const submit = async () => {
    setBusy(true);
    try {
      const input: ActivityInput = { ...form, conditions: form.conditions?.trim() || undefined, visibilityTargets: form.visibility === 'department' && !form.visibilityTargets?.length ? [v.me.affiliation.type === 'university' ? v.me.affiliation.department : ''] : form.visibilityTargets };
      if (editing) {
        await run(() => api.activities.update(editing.id, input), '활동을 수정했어요.');
        nav(`/activities/${editing.id}`, { replace: true });
      } else {
        const res = await run(() => api.activities.create(v.me.id, input), '활동을 만들었어요!');
        nav(`/activities/${res.activity.id}`, { replace: true });
      }
    } catch { setBusy(false); }
  };

  return (
    <div className="min-h-full pb-28">
      <TopBar back title={editing ? '활동 수정' : `${KIND_LABELS[kind]} 만들기`} />
      <div className="px-4 py-4 space-y-5">
        {kind === 'org_event' && (
          <Field label="주최 조직" hint={myOrgs.length ? undefined : '가입된 조직이 없어 개인 이름으로 등록돼요. 학생 동아리 행사 등록은 무료예요.'}>
            {myOrgs.length ? <Select value={form.orgId ?? ''} onChange={(e) => patch({ orgId: e.target.value || undefined })}><option value="">개인 이름으로</option>{myOrgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</Select> : null}
          </Field>
        )}
        <Field label="활동 종류" required>
          <div className="flex flex-wrap gap-2">{ALL_CATEGORIES.map((c) => <Chip key={c} color={CATEGORY_COLORS[c]} active={form.category === c} onClick={() => setCategory(c)}>{CATEGORY_EMOJI[c]} {CATEGORY_LABELS[c]}</Chip>)}</div>
        </Field>
        <Field label="제목" required><Input placeholder="예: 오늘 오후 6시 신촌에서 커피 마실 사람?" value={form.title} onChange={(e) => patch({ title: e.target.value })} maxLength={60} /></Field>
        <Field label="설명" required><Textarea placeholder="예: 창업이나 AI에 관심 있는 분이면 좋아요. 최대 4명." value={form.description} onChange={(e) => patch({ description: e.target.value })} maxLength={500} /></Field>
        <Field label="대표 이미지" hint="데모에서는 색상과 이모지로 대표 이미지를 만들어요.">
          <div className="flex items-center gap-3">
            <div className="h-16 w-16 rounded-2xl grid place-items-center text-3xl shrink-0" style={{ background: `linear-gradient(135deg, hsl(${form.cover.hue} 80% 92%), hsl(${(form.cover.hue + 50) % 360} 70% 68%))` }}>{form.cover.emoji}</div>
            <div className="flex flex-wrap gap-1.5">{COVER_HUES.map((h) => <button key={h} type="button" onClick={() => patch({ cover: { ...form.cover, hue: h } })} className={cn('h-7 w-7 rounded-full', form.cover.hue === h && 'ring-2 ring-offset-2 ring-ink')} style={{ background: `hsl(${h} 75% 70%)` }} aria-label={`색상 ${h}`} />)}</div>
          </div>
        </Field>
        <div className="grid grid-cols-3 gap-2">
          <Field label="날짜" required><Input type="date" min={todayISO()} value={form.date} onChange={(e) => patch({ date: e.target.value })} /></Field>
          <Field label="시작" required><Input type="time" value={form.startTime} onChange={(e) => patch({ startTime: e.target.value })} /></Field>
          <Field label="종료" required><Input type="time" value={form.endTime} onChange={(e) => patch({ endTime: e.target.value })} /></Field>
        </div>
        <Field label="장소" required hint="선택한 장소만 지도에 표시돼요. 내 위치는 공개되지 않아요.">
          <div className="flex flex-wrap gap-1.5 mb-2">{presets.map((p) => <Chip key={p.name} size="sm" active={form.place.name === p.name} onClick={() => { patch({ place: p }); setCustomPlace(false); }}>{p.name}</Chip>)}<Chip size="sm" active={customPlace} onClick={() => setCustomPlace(true)}><MapPin size={12} /> 지도에서 직접</Chip></div>
          {customPlace && (
            <div className="space-y-2">
              <Input placeholder="장소 이름" value={form.place.name} onChange={(e) => patch({ place: { ...form.place, name: e.target.value } })} />
              <div className="h-[180px] rounded-xl overflow-hidden border border-line">
                <MapContainer center={[form.place.lat, form.place.lng]} zoom={16} className={`h-full w-full z-0 ${TILES_ENABLED ? '' : 'no-tiles'}`} zoomControl={false} attributionControl={false}>
                  {TILES_ENABLED ? <TileLayer url={TILE_URL} /> : <LandmarkLayer schoolId={schoolId} />}
                  <ClickToPlace onPick={(lat, lng) => patch({ place: { ...form.place, lat, lng } })} />
                  <Marker position={[form.place.lat, form.place.lng]} icon={L.divIcon({ className: 'leaflet-div-icon', html: `<div class="au-marker" style="background:${CATEGORY_COLORS[form.category]}"><span>${CATEGORY_EMOJI[form.category]}</span></div>`, iconSize: [36, 36], iconAnchor: [18, 34] })} />
                </MapContainer>
              </div>
              <p className="text-[11px] text-ink-3">지도를 탭해서 위치를 옮길 수 있어요.</p>
            </div>
          )}
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="모집 인원" required><Input type="number" min={1} value={form.capacity} onChange={(e) => patch({ capacity: Math.max(1, Number(e.target.value)) })} /></Field>
          <Field label="참가비 (원)"><Input type="number" min={0} step={1000} value={form.fee} onChange={(e) => patch({ fee: Math.max(0, Number(e.target.value)) })} /></Field>
        </div>
        <Field label="참가 조건 (선택)"><Input placeholder="예: 창업이나 AI에 관심 있는 분" value={form.conditions ?? ''} onChange={(e) => patch({ conditions: e.target.value })} /></Field>
        <Field label="참가 승인 방식" required>
          <div className="space-y-1.5">{(Object.keys(JOIN_POLICY_LABELS) as JoinPolicy[]).map((j) => (
            <button key={j} type="button" onClick={() => patch({ joinPolicy: j })} className={cn('w-full text-left rounded-xl px-3.5 h-11 text-[14px] font-medium border flex items-center justify-between', form.joinPolicy === j ? 'border-primary bg-primary-soft' : 'border-line')}>{JOIN_POLICY_LABELS[j]}<span className={cn('h-4 w-4 rounded-full border-2', form.joinPolicy === j ? 'border-primary bg-primary' : 'border-line')} /></button>
          ))}</div>
          {form.joinPolicy === 'invite' && (
            <div className="mt-2"><p className="text-[12px] text-ink-3 mb-1.5">초대할 친구</p><div className="flex flex-wrap gap-1.5">{friends.map((f) => <Chip key={f.id} size="sm" active={form.invitedIds?.includes(f.id)} onClick={() => patch({ invitedIds: form.invitedIds?.includes(f.id) ? form.invitedIds.filter((x) => x !== f.id) : [...(form.invitedIds ?? []), f.id] })}>{f.avatar.emoji} {f.nickname}</Chip>)}{friends.length === 0 && <span className="text-[12px] text-ink-3">친구가 없어요</span>}</div></div>
          )}
        </Field>
        <Field label="공개 범위" required>
          <VisibilityList value={form.visibility} options={['public', 'school', 'department', 'friends', 'selected']} onChange={(vis: Visibility) => patch({ visibility: vis })} />
          {form.visibility === 'department' && <Input className="mt-2" placeholder="학과·조직 이름 (예: 컴퓨터과학과)" value={form.visibilityTargets?.[0] ?? ''} onChange={(e) => patch({ visibilityTargets: e.target.value ? [e.target.value] : [] })} />}
          {form.visibility === 'selected' && (
            <div className="mt-2 flex flex-wrap gap-1.5">{friends.map((f) => <Chip key={f.id} size="sm" active={form.visibilityTargets?.includes(f.id)} onClick={() => patch({ visibilityTargets: form.visibilityTargets?.includes(f.id) ? form.visibilityTargets.filter((x) => x !== f.id) : [...(form.visibilityTargets ?? []), f.id] })}><Avatar emoji={f.avatar.emoji} hue={f.avatar.hue} size={18} /> {f.nickname}</Chip>)}</div>
          )}
        </Field>
        <div className="rounded-xl bg-surface-2 px-3.5 py-3 text-[12px] text-ink-2"><b>미리보기</b> · {preview}</div>
      </div>
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-surface/95 backdrop-blur border-t border-line p-3 safe-bottom z-20">
        <Button full size="lg" disabled={!valid} loading={busy} onClick={submit}>{editing ? '수정 완료' : '활동 만들기'}</Button>
      </div>
    </div>
  );
}

function ClickToPlace({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (e) => onPick(e.latlng.lat, e.latlng.lng) });
  return null;
}

