import { Pressable, Text, View } from 'react-native';
import { Settings, Pencil, ShieldCheck, BadgeCheck, CalendarDays, ChevronRight, Users, CalendarCheck, Bookmark, MessageCircle, Building2, Quote, Bell } from 'lucide-react-native';
import { t, lang } from '@core/i18n';
import { useAppStore } from '@core/store/useAppStore';
import { INTEREST_LABELS } from '@core/lib/labels';
import { friendsOf } from '@core/lib/relations';
import { todayISO, formatDateTime } from '@core/lib/format';
import { DAY_LABELS, toMin, statusNow, freeBlocks, todayIdx, nowMin, fmtBlock, toHHMM } from '@core/lib/timetable';
import { profileCompletion, questionById } from '@core/data/prompts';
import { tw } from '@/tw';
import { useViewer } from '@/viewer';
import { nav } from '@/nav';
import { TabScreen, AppHeader, IconBtn, Avatar, Button, Card, Tag, H1, H2, IconCircle, C } from '@/ui';

const H0 = 9, H1H = 18, PX = 26;

/** 나 — 프로필 카드 · 주간 시간표 · 다가오는 약속 (Pastel Breeze) */
export default function MeScreen() {
  const v = useViewer();
  const activities = useAppStore((s) => s.activities);
  const participations = useAppStore((s) => s.participations);
  const polls = useAppStore((s) => s.timePolls);
  const intents = useAppStore((s) => s.opportunityIntents);
  const orgs = useAppStore((s) => s.organizations);
  const me = v.me;
  const friends = friendsOf(v.snap, me.id).length;
  const today = todayISO();
  const upcoming = activities.filter((a) => a.date >= today && (a.hostId === me.id || participations.some((p) => p.activityId === a.id && p.userId === me.id && (p.status === 'approved' || p.status === 'pending')))).sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  const hangouts = activities.filter((a) => participations.some((p) => p.activityId === a.id && p.userId === me.id && p.status === 'approved')).length + activities.filter((a) => a.hostId === me.id).length;
  const completion = profileCompletion(me);
  const goTo = me.prompts[0];
  const now = statusNow(me.timetable);
  const nextFree = freeBlocks(me.timetable, todayIdx()).find((b) => b.end > nowMin());
  const days = [0, 1, 2, 3, 4];
  const openPolls = polls.filter((p) => p.status === 'open' && (p.hostId === me.id || p.inviteeIds.includes(me.id))).length;
  const saved = intents.filter((i) => i.userId === me.id && (i.saved || i.intent === 'applied')).length;
  const myOrgs = orgs.filter((o) => o.memberIds.includes(me.id) || o.adminIds.includes(me.id)).length;
  const dept = me.affiliation.type === 'university' ? `${me.affiliation.department} • ${me.affiliation.schoolName}` : '';
  const stats = [{ n: String(friends), l: t('친구'), to: '/profile/friends' }, { n: String(hangouts), l: lang === 'en' ? 'Hangouts' : '활동', to: '/plans' }, { n: `${completion.percent}%`, l: lang === 'en' ? 'Profile' : '프로필 완성', to: '/profile/prompts' }];
  const links = [
    { Icon: Users, label: t('친구'), sub: `${friends}${t('명')}`, to: '/profile/friends' },
    { Icon: CalendarCheck, label: 'My Plans', sub: openPolls ? `${t('시간 정하는 중')} ${openPolls}` : t('초대·대기·확정'), to: '/plans' },
    { Icon: Bookmark, label: t('저장·지원 내역'), sub: `${saved}${t('개')}`, to: '/community?tab=opportunities&sub=saved' },
    { Icon: MessageCircle, label: t('채팅'), sub: t('개인·활동·조직 대화'), to: '/chats' },
    { Icon: Bell, label: t('알림'), sub: t('요청·승인·마감 알림'), to: '/notifications' },
    { Icon: Building2, label: t('가입한 단체'), sub: `${myOrgs}${t('개')}`, to: '/community?tab=clubs&mine=1' },
  ];

  return (
    <TabScreen header={<AppHeader right={<IconBtn onPress={() => nav('/settings')}><Settings size={21} color={C.ink2} /></IconBtn>} />}>
      <Card>
        <View style={tw`flex-row items-center`}>
          <Avatar emoji={me.avatar.emoji} hue={me.avatar.hue} url={me.avatar.url} size={72} />
          <View style={tw`flex-1 min-w-0 ml-4`}>
            <H1>{me.nickname}</H1>
            <Text numberOfLines={1} style={tw`text-[13px] text-ink-2`}>{dept}</Text>
            {me.affiliation.type === 'university' && me.affiliation.emailVerified ? <View style={tw`mt-1.5 self-start flex-row items-center h-6 px-2.5 rounded-full bg-accent-soft border border-accent`}><BadgeCheck size={12} color={C.primary} /><Text style={tw`ml-1 text-[11px] font-bold text-primary`}>{lang === 'en' ? 'Campus verified' : '학교 인증'}</Text></View> : null}
          </View>
        </View>
        <View style={tw`mt-5 flex-row`}>
          {stats.map((s) => <Pressable key={s.l} onPress={() => nav(s.to)} style={tw`flex-1 items-center py-1`}><Text style={tw`text-[22px] font-bold text-primary`}>{s.n}</Text><Text style={tw`text-[12px] text-ink-3`}>{s.l}</Text></Pressable>)}
        </View>
        {goTo?.answer ? (
          <View style={tw`mt-4 rounded-2xl bg-surface-2 px-4 py-3`}>
            <View style={tw`flex-row items-center`}><Quote size={11} color={C.verify} /><Text style={tw`ml-1 text-[11px] font-bold text-verify uppercase`}>{questionById(goTo.questionId)?.text}</Text></View>
            <Text style={tw`mt-1 text-[14px] text-ink-2 italic`}>“{goTo.answer}”</Text>
          </View>
        ) : null}
        <View style={tw`mt-3 flex-row flex-wrap`}>{me.interests.slice(0, 5).map((i) => <View key={i} style={tw`h-7 px-3 mr-1.5 mb-1.5 rounded-full bg-accent-soft justify-center`}><Text style={tw`text-[12px] font-semibold text-primary`}>#{INTEREST_LABELS[i]}</Text></View>)}</View>
        <View style={tw`mt-4 flex-row`}>
          <Button full icon={<Pencil size={15} color="#fff" />} onPress={() => nav('/profile/edit')}>{t('프로필 편집')}</Button>
          <View style={tw`w-2`} />
          <Button full variant="secondary" icon={<ShieldCheck size={15} color={C.primary} />} onPress={() => nav('/settings/privacy')}>{t('공개 범위')}</Button>
        </View>
      </Card>

      <Card style={tw`mt-4`}>
        <View style={tw`flex-row items-center justify-between`}>
          <View style={tw`flex-row items-center`}><CalendarDays size={18} color={C.primary} /><H2 style={tw`ml-2`}>{lang === 'en' ? 'Weekly Schedule' : '내 시간표'}</H2></View>
          {me.timetable.length > 0 ? <View style={tw`h-7 px-3 rounded-full flex-row items-center ${now.kind === 'free' ? 'bg-mint-soft' : 'bg-surface-2'}`}><View style={tw`h-1.5 w-1.5 rounded-full mr-1 ${now.kind === 'free' ? 'bg-mint' : 'bg-ink-3'}`} /><Text style={tw`text-[11px] font-bold ${now.kind === 'free' ? 'text-mint' : 'text-ink-2'}`}>{now.kind === 'free' ? (now.until ? `${t('공강')} · ${toHHMM(now.until)}` : t('오늘 수업 없음')) : now.kind === 'in_class' ? t('수업 중') : t('오늘 수업 끝')}</Text></View> : null}
        </View>
        {me.timetable.length === 0 ? <Button variant="secondary" style={tw`mt-4`} onPress={() => nav('/timetable')}>{t('시간표 만들기')}</Button> : (
          <>
            <Pressable onPress={() => nav('/timetable')} style={tw`mt-3`}>
              <View style={tw`flex-row`}><View style={{ width: 20 }} />{days.map((d) => <Text key={d} style={tw`flex-1 text-center text-[11px] font-semibold ${d === todayIdx() ? 'text-primary' : 'text-ink-3'}`}>{DAY_LABELS[d]}</Text>)}</View>
              <View style={[tw`flex-row mt-1`, { height: (H1H - H0) * PX }]}>
                <View style={{ width: 20 }}>{Array.from({ length: H1H - H0 }, (_, i) => <Text key={i} style={[tw`absolute text-[9px] text-ink-3`, { top: i * PX }]}>{H0 + i}</Text>)}</View>
                {days.map((d) => (
                  <View key={d} style={[tw`flex-1 border-l border-line`, d === todayIdx() ? { backgroundColor: 'rgba(191,244,255,0.4)' } : null]}>
                    {me.timetable.filter((c) => c.day === d).map((c) => (
                      <View key={c.id} style={[tw`absolute left-0.5 right-0.5 rounded-lg bg-primary-soft px-1 overflow-hidden`, { top: Math.max(0, (toMin(c.start) - H0 * 60) / 60 * PX), height: Math.max(14, (toMin(c.end) - toMin(c.start)) / 60 * PX - 2) }]}>
                        <Text numberOfLines={1} style={tw`text-[9px] font-bold text-primary`}>{c.name}</Text>
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </Pressable>
            {nextFree ? <View style={tw`mt-3 flex-row items-center`}><Text style={tw`text-verify mr-2`}>★</Text><Text numberOfLines={1} style={tw`flex-1 text-[13px] text-ink-2`}>{lang === 'en' ? `Next free window ${fmtBlock({ start: Math.max(nextFree.start, nowMin()), end: nextFree.end })}` : `다음 공강 ${fmtBlock({ start: Math.max(nextFree.start, nowMin()), end: nextFree.end })}`}</Text><Button size="sm" onPress={() => nav('/timetable?open=1')}>{t('열기')}</Button></View> : null}
          </>
        )}
      </Card>

      <Card style={tw`mt-4`}>
        <View style={tw`flex-row items-center justify-between mb-2`}><View style={tw`flex-row items-center`}><CalendarCheck size={18} color={C.primary} /><H2 style={tw`ml-2`}>{lang === 'en' ? 'Upcoming Hangouts' : '다가오는 약속'}</H2></View><Pressable onPress={() => nav('/plans')}><Text style={tw`text-[13px] font-semibold text-verify`}>{t('전체')} ({upcoming.length + openPolls})</Text></Pressable></View>
        {upcoming.length === 0 && openPolls === 0 ? <Text style={tw`text-[13px] text-ink-3`}>{t('확정된 약속이 없어요.')}</Text> : upcoming.slice(0, 3).map((a, i) => { const pending = participations.some((p) => p.activityId === a.id && p.userId === me.id && p.status === 'pending'); return (
          <Pressable key={a.id} onPress={() => nav(`/activities/${a.id}`)} style={tw`flex-row items-center py-3 ${i === 0 ? '' : 'border-t border-line'}`}>
            <IconCircle><CalendarCheck size={17} color={C.primary} /></IconCircle>
            <View style={tw`flex-1 min-w-0 mx-3`}><Text numberOfLines={1} style={tw`text-[14px] font-semibold text-primary`}>{a.title}</Text><Text style={tw`text-[12px] text-ink-3`}>{formatDateTime(a.date, a.startTime)}</Text></View>
            <Tag tone={pending ? 'neutral' : 'primary'}>{pending ? t('대기') : lang === 'en' ? 'Confirmed' : '확정'}</Tag>
          </Pressable>
        ); })}
      </Card>

      <View style={tw`mt-4 rounded-[24px] border border-line bg-white`}>
        {links.map((r, i) => (
          <Pressable key={r.label} onPress={() => nav(r.to)} style={tw`flex-row items-center px-4 py-3 ${i === 0 ? '' : 'border-t border-line'}`}>
            <IconCircle><r.Icon size={18} color={C.primary} /></IconCircle>
            <View style={tw`flex-1 min-w-0 mx-3`}><Text style={tw`text-[14px] font-semibold text-primary`}>{r.label}</Text><Text numberOfLines={1} style={tw`text-[12px] text-ink-3`}>{r.sub}</Text></View>
            <ChevronRight size={18} color={C.ink3} />
          </Pressable>
        ))}
      </View>
    </TabScreen>
  );
}
