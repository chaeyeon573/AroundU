import type { AroundUApi } from './types';
import { mockApi } from './mock';

/**
 * 앱 전체에서 사용하는 API 진입점.
 * 백엔드가 준비되면 이 파일에서 mockApi → 실제 구현체로만 바꾸면 된다.
 */
export const api: AroundUApi = mockApi;
export type * from './types';
