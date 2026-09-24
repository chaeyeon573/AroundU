import { useLocalSearchParams } from 'expo-router';
import { ActivityForm } from '@/components/c_ActivityForm';

/** 활동 수정 — /activities/:id/edit */
export default function EditActivityScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ActivityForm editId={id} />;
}
