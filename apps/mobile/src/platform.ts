/**
 * 모바일 플랫폼 어댑터 — core는 동기 저장소를 기대하므로 AsyncStorage를 메모리 캐시에 미리 올린다(hydrate).
 * 쓰기는 메모리에 즉시 반영하고 AsyncStorage에는 비동기로 흘려보낸다.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { setPlatform } from '@core/platform';
import { PHOTOS } from './photos';

// Hermes에 structuredClone이 없는 버전을 위한 폴리필 (core mock DB가 사용)
if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = (v: unknown) => (v === undefined ? v : JSON.parse(JSON.stringify(v)));
}

const memory = new Map<string, string>();
const PREFIX = 'aroundu.';
let reloadHandler: () => void = () => {};

export function setReloadHandler(fn: () => void) { reloadHandler = fn; }

setPlatform({
  getItem: (k) => memory.get(k) ?? null,
  setItem: (k, v) => { memory.set(k, v); AsyncStorage.setItem(k, v).catch(() => {}); },
  removeItem: (k) => { memory.delete(k); AsyncStorage.removeItem(k).catch(() => {}); },
  reload: () => reloadHandler(),
  locale: () => getLocales()[0]?.languageTag ?? 'en-US',
  asset: (path) => PHOTOS[path] ?? path,
});

/** 앱 시작 전에 저장된 키를 전부 메모리로 올린다 */
export async function hydrate() {
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(PREFIX));
    const pairs = await AsyncStorage.multiGet(keys);
    pairs.forEach(([k, v]) => { if (v != null) memory.set(k, v); });
  } catch { /* 첫 실행 */ }
}
