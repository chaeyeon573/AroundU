import type { AroundUApi } from './types';
import { mockApi } from './mock';
import { createRemoteApi } from './remote';

/**
 * 앱 전체에서 사용하는 API 진입점.
 *
 * - 기본: localStorage 위에서 도는 mock (예시 데이터, 자동 응답)
 * - `VITE_API_MODE=remote`: Railway 등에 배포한 서버(`server/`)를 사용. `VITE_API_URL`이 비어 있으면 같은 origin의 `/api`.
 */
const mode = import.meta.env.VITE_API_MODE ?? 'mock';
export const api: AroundUApi = mode === 'remote' ? createRemoteApi(import.meta.env.VITE_API_URL || '') : mockApi;
export const apiMode: 'mock' | 'remote' = mode === 'remote' ? 'remote' : 'mock';
export type * from './types';
