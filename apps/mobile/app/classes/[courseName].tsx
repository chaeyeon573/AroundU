import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { t, lang } from '@core/i18n';
import { tw } from '@/tw';
import { useViewer } from '@/viewer';
import { Screen, Empty } from '@/ui';
import { ClassSpaceContent } from '@/components/c_ClassSpace';

/** 수업 공간 — /classes/:courseName (웹 ClassPage 와 동일) */
export default function ClassScreen() {
  const { courseName = '' } = useLocalSearchParams<{ courseName: string }>();
  const name = decodeURIComponent(courseName);
  const v = useViewer();
  const has = v.me.timetable.some((c) => c.name === name);
  return (
    <Screen title={lang === 'en' ? 'Class Space' : '수업 공간'}>
      <View style={tw`pt-3`}>
        {!has ? <Empty title={t('내 시간표에 없는 수업이에요')} /> : <ClassSpaceContent courseName={name} />}
      </View>
    </Screen>
  );
}
