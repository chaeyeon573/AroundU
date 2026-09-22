import { en } from './en';

export type Lang = 'ko' | 'en';
const KEY = 'aroundu.lang';

function readLang(): Lang {
  try {
    const v = localStorage.getItem(KEY);
    if (v === 'en' || v === 'ko') return v;
    return navigator.language.toLowerCase().startsWith('ko') ? 'ko' : 'en';
  } catch { return 'ko'; }
}

export let lang: Lang = readLang();

/** 언어 변경 — mock DB도 언어별로 분리되어 있어 새로고침으로 전체를 다시 그린다 */
export function setLang(next: Lang) {
  try { localStorage.setItem(KEY, next); } catch { /* */ }
  lang = next;
  window.location.reload();
}

/** 한국어 원문을 키로 쓰는 번역 함수. 사전에 없으면 원문을 돌려준다 */
export function t(ko: string): string {
  if (lang === 'ko') return ko;
  return en[ko] ?? ko;
}

/** 라벨 맵을 접근 시점에 번역하는 Proxy로 감싼다 */
export function tr<T extends Record<string, string>>(map: T): T {
  return new Proxy(map, { get: (target, prop) => (typeof prop === 'string' && prop in target ? t(target[prop]) : Reflect.get(target, prop)) }) as T;
}

/** 날짜·숫자 로케일 */
export const locale = () => (lang === 'ko' ? 'ko-KR' : 'en-US');
