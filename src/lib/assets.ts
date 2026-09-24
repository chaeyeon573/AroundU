import { getPlatform } from '@core/platform';
export { photo } from '@core/lib/assets';
/** 웹에서는 항상 URL 문자열 */
export const assetUrl = (path: string) => getPlatform().asset(path) as string;
