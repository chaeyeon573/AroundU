import { useLocalSearchParams } from 'expo-router';
import { ActivityForm } from '@/components/c_ActivityForm';

/** 활동 만들기 — /create/activity?kind=&now=&invite=&team=&crew=&opportunity=&id= (id 가 있으면 수정) */
export default function CreateActivityScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  return <ActivityForm editId={id || undefined} />;
}
