import type { Post, User } from '@core/types';
import { todayISO } from './format';

/** 무료 플랜 하루 친구 요청(오른쪽 스와이프) 한도 — Hinge(8)·Bumble(50+) 사이, 친구 앱이라 가볍게 */
export const FREE_SWIPES_PER_DAY = 10;

/** AroundU+ 가격표 (모의 결제) */
export const PLANS = {
  ko: { monthly: { label: '월', price: '₩4,900', per: '/월' }, yearly: { label: '연', price: '₩39,000', per: '/년', badge: '-33%' } },
  en: { monthly: { label: 'Monthly', price: '$4.99', per: '/mo' }, yearly: { label: 'Yearly', price: '$39.99', per: '/yr', badge: '-33%' } },
} as const;

export const isPlus = (u: Pick<User, 'plan'>) => u.plan === 'plus';

/** 오늘 남은 무료 친구 요청 수 (Plus 는 Infinity) */
export function swipesLeft(u: Pick<User, 'plan' | 'swipes'>): number {
  if (isPlus(u)) return Infinity;
  const used = u.swipes?.date === todayISO() ? u.swipes.count : 0;
  return Math.max(0, FREE_SWIPES_PER_DAY - used);
}

/** 피드 행 사이에 스폰서 글을 `every` 개마다 하나씩 끼운다 (Plus 사용자는 광고 없음) */
export function injectSponsored<T extends Post>(posts: T[], ads: T[], viewer: Pick<User, 'plan'>, every = 4): T[] {
  if (isPlus(viewer) || ads.length === 0) return posts;
  const out: T[] = [];
  let ai = 0;
  posts.forEach((p, i) => {
    out.push(p);
    if ((i + 1) % every === 0 && ai < ads.length) out.push(ads[ai++]);
  });
  if (posts.length > 0 && posts.length < every && ai < ads.length) out.push(ads[ai]);
  return out;
}
