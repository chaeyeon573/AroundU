import { getPlatform } from '@core/platform';

/** 정적 자산 경로 → 플랫폼별 소스 (웹: URL, RN: require 결과) */
export const assetUrl = (path: string) => getPlatform().asset(path);
export const photo = (name: string) => `photos/${name}.jpg`;
