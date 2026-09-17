import type { Place } from '@/types';

/** 학교별 자주 쓰는 장소 프리셋 (지도 탭으로 직접 선택도 가능) */
export const PLACE_PRESETS: Record<string, Place[]> = {
  s_yonsei: [
    { name: '중앙도서관', lat: 37.5645, lng: 126.9375 },
    { name: '학생회관', lat: 37.5637, lng: 126.9387 },
    { name: '대운동장', lat: 37.5662, lng: 126.9352 },
    { name: '정문 카페 거리', lat: 37.5589, lng: 126.9368 },
    { name: '제1공학관', lat: 37.5617, lng: 126.9367 },
    { name: '백양로', lat: 37.5625, lng: 126.9378 },
    { name: '노천극장', lat: 37.5668, lng: 126.9385 },
    { name: '신촌역 3번 출구', lat: 37.5551, lng: 126.9368 },
  ],
  s_ewha: [
    { name: 'ECC', lat: 37.5618, lng: 126.9466 },
    { name: '이대역 2번 출구', lat: 37.5567, lng: 126.9460 },
  ],
  s_sogang: [
    { name: '로욜라도서관', lat: 37.5511, lng: 126.9410 },
    { name: '서강대 정문', lat: 37.5502, lng: 126.9400 },
  ],
  s_hongik: [
    { name: '홍대입구역 3번 출구', lat: 37.5571, lng: 126.9245 },
    { name: '홍익대 정문', lat: 37.5511, lng: 126.9250 },
  ],
};
