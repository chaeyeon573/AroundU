import { SafeAreaView } from 'react-native-safe-area-context';
import { tw } from '@/tw';
import { t } from '@core/i18n';
import { Soon } from '@/ui';

export default function Screen() {
  return <SafeAreaView edges={['top']} style={tw`flex-1 bg-white`}><Soon title={t('만들기')} /></SafeAreaView>;
}
