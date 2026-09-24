import type { Place } from '@core/types';

/** 학교별 자주 쓰는 장소 프리셋 (지도 탭으로 직접 선택도 가능) */
export const PLACE_PRESETS: Record<string, Place[]> = {
  s_berkeley: [
    { name: 'Doe Library', lat: 37.8722, lng: -122.2592 },
    { name: 'MLK Student Union', lat: 37.8692, lng: -122.2598 },
    { name: 'Sproul Plaza', lat: 37.8697, lng: -122.2594 },
    { name: 'Memorial Glade', lat: 37.8730, lng: -122.2596 },
    { name: 'Soda Hall', lat: 37.8756, lng: -122.2588 },
    { name: 'Caffe Strada', lat: 37.8690, lng: -122.2547 },
    { name: 'Edwards Track', lat: 37.8697, lng: -122.2645 },
    { name: 'Greek Theatre', lat: 37.8735, lng: -122.2541 },
  ],
  s_stanford: [{ name: 'Green Library', lat: 37.4265, lng: -122.1660 }, { name: 'Tresidder Union', lat: 37.4240, lng: -122.1705 }],
  s_sfsu: [{ name: 'J. Paul Leonard Library', lat: 37.7219, lng: -122.4782 }],
  s_ucla: [{ name: 'Powell Library', lat: 34.0716, lng: -118.4421 }],
  s_mit: [{ name: 'Stata Center', lat: 42.3616, lng: -71.0908 }],
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
