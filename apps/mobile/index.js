// 앱 진입점 — 'main'을 동기적으로 등록해야 Expo Go가 찾는다 (expo-router/entry-classic 과 같은 구조).
// core의 i18n·mock DB가 import 시점에 저장소를 읽으므로, 라우트(=core)를 그리기 전에 AsyncStorage를 메모리로 올린다(hydrate).
import '@expo/metro-runtime';
import { useEffect, useState } from 'react';
import { App } from 'expo-router/build/qualified-entry';
import { renderRootComponent } from 'expo-router/build/renderRootComponent';
import { hydrate } from './src/platform';

function Gate() {
  const [ready, setReady] = useState(false);
  useEffect(() => { hydrate().then(() => setReady(true)); }, []);
  return ready ? <App /> : null;
}

renderRootComponent(Gate);
