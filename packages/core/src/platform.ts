/**
 * 플랫폼 어댑터 — core는 브라우저·React Native API를 직접 쓰지 않는다.
 * 웹은 localStorage/`import.meta.env.BASE_URL`, 모바일은 AsyncStorage(메모리 캐시)와 require 맵을 꽂는다.
 * 앱은 core 모듈을 import하기 **전에** setPlatform을 호출해야 한다 (i18n·라벨이 import 시점에 언어를 읽는다).
 */
export interface Platform {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  /** 언어 변경 등 전체 재시작이 필요할 때 */
  reload(): void;
  /** 기기 언어 (예: 'ko-KR') */
  locale(): string;
  /** 정적 자산 경로 → 웹은 URL 문자열, RN은 require() 결과(number) */
  asset(path: string): string | number;
  /** 빌드 환경 변수 (예: API_MODE, API_URL). 웹은 VITE_*, 모바일은 EXPO_PUBLIC_* 에서 읽는다 */
  env(key: 'API_MODE' | 'API_URL'): string | undefined;
}

const memory = new Map<string, string>();
let platform: Platform = {
  getItem: (k) => memory.get(k) ?? null,
  setItem: (k, v) => { memory.set(k, v); },
  removeItem: (k) => { memory.delete(k); },
  reload: () => {},
  locale: () => 'ko-KR',
  asset: (p) => p,
  env: () => undefined,
};

export function setPlatform(p: Platform) { platform = p; }
export const getPlatform = () => platform;
