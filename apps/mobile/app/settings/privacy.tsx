import { Text, View } from 'react-native';
import { t } from '@core/i18n';
import { useAppStore } from '@core/store/useAppStore';
import { api } from '@core/api';
import type { ProfileField, Visibility } from '@core/types';
import { tw } from '@/tw';
import { useViewer } from '@/viewer';
import { Screen, Toggle } from '@/ui';
import { VisibilityPicker } from '@/components/b_VisibilityPicker';

const FIELDS: { key: ProfileField; label: string; desc?: string }[] = [
  { key: 'bio', label: t('자기소개') },
  { key: 'prompts', label: t('질문 답변 (텍스트·음성·투표)'), desc: t('홈 카드에도 첫 번째 답변이 보여요') },
  { key: 'interests', label: t('관심사'), desc: t('추천에 사용되므로 전체 공개를 권장해요') },
  { key: 'likes', label: t('좋아하는 것') },
  { key: 'freeTime', label: t('하고 싶은 활동') },
  { key: 'availability', label: t('활동 가능한 시간'), desc: t('시간표가 없을 때 쓰는 수동 설정') },
  { key: 'goals', label: t('이번 학기 목표') },
  { key: 'living', label: t('생활권'), desc: t('기숙사·자취·통학과 대략적인 구역만') },
  { key: 'timetable', label: t('시간표 공강 여부'), desc: t('전체 시간표와 강의실은 공개되지 않고 공강 시간만 보여요') },
  { key: 'purposes', label: t('이용 목적') },
  { key: 'height', label: t('키') },
  { key: 'preferredPartner', label: t('관심 있는 사람의 조건') },
  { key: 'posts', label: t('사진과 게시물 그리드') },
];

/** 공개 범위 설정 (웹 PrivacySettingsPage) */
export default function PrivacySettingsScreen() {
  const v = useViewer();
  const run = useAppStore((s) => s.run);
  const me = v.me;
  const aff = me.affiliation.type === 'university' ? me.affiliation : null;
  const set = (k: ProfileField, vis: Visibility) => run(() => api.users.update(me.id, { fieldVisibility: { ...me.fieldVisibility, [k]: vis } }));
  return (
    <Screen title={t('공개 범위 설정')}>
      <View style={tw`py-3`}>
        <Text style={tw`text-[12px] text-ink-3`}>{t('멀티프로필 대신 항목별로 공개 범위를 정해요. 정확한 위치는 어떤 설정에서도 공개되지 않아요.')}</Text>
        <View style={tw`rounded-[24px] border border-line bg-white mt-3`}>
          {FIELDS.map((f, i) => (
            <View key={f.key} style={tw`flex-row items-center px-4 py-3 ${i === 0 ? '' : 'border-t border-line'}`}>
              <View style={tw`flex-1 mr-3`}><Text style={tw`text-[14px] font-medium text-ink`}>{f.label}</Text>{f.desc && <Text style={tw`text-[11px] text-ink-3`}>{f.desc}</Text>}</View>
              <VisibilityPicker compact value={me.fieldVisibility[f.key]} onChange={(vis) => set(f.key, vis)} label={`${f.label}${t(' 공개 범위')}`} />
            </View>
          ))}
        </View>
        {aff && (
          <View style={tw`rounded-[24px] border border-line bg-white px-4 mt-3`}>
            <Toggle label={t('학교명 공개')} checked={aff.showSchool} onChange={(val) => run(() => api.users.update(me.id, { affiliation: { ...aff, showSchool: val } }))} />
            <View style={tw`h-px bg-line`} />
            <Toggle label={t('학과 공개')} checked={aff.showDepartment} onChange={(val) => run(() => api.users.update(me.id, { affiliation: { ...aff, showDepartment: val } }))} />
          </View>
        )}
      </View>
    </Screen>
  );
}
