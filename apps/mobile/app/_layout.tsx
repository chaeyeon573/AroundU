import '../src/platform'; // core보다 먼저 — 저장소·언어 어댑터 등록
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAppStore } from '@core/store/useAppStore';
import { api } from '@core/api';

export default function RootLayout() {
  const status = useAppStore((s) => s.status);
  const currentUserId = useAppStore((s) => s.currentUserId);
  const init = useAppStore((s) => s.init);
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    (async () => {
      await init();
      // 데모: 세션이 없으면 데모 계정으로 바로 로그인
      if (!useAppStore.getState().currentUserId) {
        const u = await api.auth.loginDemo();
        await setCurrentUser(u);
      }
      setBooting(false);
    })();
  }, [init, setCurrentUser]);

  const ready = !booting && status === 'ready' && !!currentUserId;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        {ready ? (
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#fff' } }} />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}><ActivityIndicator color="#0F2B48" /></View>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
