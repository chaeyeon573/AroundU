import { RefreshCw } from 'lucide-react-native';
import { t } from '@core/i18n';
import { Empty, Button, C } from '@/ui';

/** 불러오기 실패 상태 (웹 ErrorState 와 동일 문구) */
export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return <Empty title={t('불러오지 못했어요')} description={message ?? t('네트워크 연결을 확인하고 다시 시도해주세요.')} action={onRetry ? <Button variant="outline" size="sm" icon={<RefreshCw size={14} color={C.ink2} />} onPress={onRetry}>{t('다시 시도')}</Button> : undefined} />;
}
