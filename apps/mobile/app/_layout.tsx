import '../src/platform'; // core보다 먼저 — 저장소·언어 어댑터 등록
import { useEffect, useState } from 'react';
import { ActivityIndicator, DevSettings, View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as Updates from 'expo-updates';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAppStore } from '@core/store/useAppStore';
import { api } from '@core/api';
import { setReloadHandler } from '@/platform';
import { FONTS, applyDefaultFont } from '@/fonts';
import { Toast } from '@/ui';

// 언어 변경 등 전체 재시작: 배포 빌드는 Updates.reloadAsync, 개발은 DevSettings.reload
setReloadHandler(() => { Updates.reloadAsync().catch(() => { try { DevSettings.reload(); } catch { /* */ } }); });

export default function RootLayout() {
  const status = useAppStore((s) => s.status);
  const currentUserId = useAppStore((s) => s.currentUserId);
  const init = useAppStore((s) => s.init);
  const setCurrentUser = useAppStore((s) => s.setCurrentUser);
  const [booting, setBooting] = useState(true);
  const [fontsLoaded] = useFonts(FONTS);
  if (fontsLoaded) applyDefaultFont();

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

  const ready = !booting && fontsLoaded && status === 'ready' && !!currentUserId;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        {ready ? (
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#fff' } }} />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}><ActivityIndicator color="#0F2B48" /></View>
        )}
        <Toast />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
