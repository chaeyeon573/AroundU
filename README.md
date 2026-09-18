# AroundU

대학생을 위한 모바일 우선 소셜 네트워킹 앱 MVP. 학교와 주변에서 열리는 활동을 발견하고 사람·동아리·모임과 연결됩니다.

- **사람** — 누구와 함께할 것인가
- **활동** — 무엇을 함께할 것인가
- **장소** — 어디에서 일어나는가

## 실행 방법

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # 타입체크 + 프로덕션 빌드
npm run preview    # 빌드 결과 미리보기
```

시작 화면에서 **로그인 (데모 계정)** 을 누르면 예시 데이터가 채워진 계정(하늘 · 연세대 컴퓨터과학과)으로 들어갑니다.
**회원가입**을 누르면 6단계 온보딩을 거쳐 새 계정을 만듭니다. 학교 이메일 인증 코드는 `123456` 입니다.

모든 데이터는 `localStorage`에 저장되는 mock API 위에서 동작합니다. 설정 → 데모 도구 → **데모 데이터 초기화**로 되돌릴 수 있습니다.

## 기술 스택

| 영역 | 선택 |
| --- | --- |
| 프레임워크 | React 19 + TypeScript + Vite 6 |
| 스타일 | Tailwind CSS v4 (`src/index.css`의 `@theme` 디자인 토큰) |
| 라우팅 | react-router v7 |
| 상태 관리 | zustand (`src/store/useAppStore.ts`) |
| 지도 | Leaflet + react-leaflet (CARTO Voyager 타일) |
| 아이콘 | lucide-react |

## 폴더 구조

```
src/
  types/            사용자·조직·활동·게시물·관계·참가·제안·채팅·알림·신고 모델
  api/
    types.ts        AroundUApi 인터페이스 + Snapshot/Patch 타입
    index.ts        api 진입점 (mockApi → 실제 구현체로 교체하는 곳)
    mock/           in-memory DB(localStorage 영속) + mock 구현
  data/             seed.ts (예시 데이터), places.ts (장소 프리셋)
  store/            zustand 앱 스토어 (스냅샷 + Patch 병합 + 토스트)
  hooks/useViewer   현재 사용자 관점의 가시성·관계 헬퍼
  lib/              labels(라벨·색상), relations(공개 범위·연결 규칙), format
  components/
    ui/             Button, Chip, Avatar, Sheet, Field, States, VisibilityPicker, Toast
    layout/         AppShell(모바일 프레임), BottomNav(가운데 + 버튼), TopBar(메시지 아이콘)
    cards/          PersonCard, ActivityCard, JoinButton, PostCard, OrgCard, ReportSheet
  pages/
    onboarding/     시작 화면 + 6단계 가입
    home/           추천 홈, 검색
    map/            지도(마커·바텀시트·목록 전환)
    activity/       활동 상세, 참가자 관리(승인·거절)
    create/         활동 만들기/수정, 게시물 작성
    community/      커뮤니티 피드
    people/         사람 상세(관심·팔로우·친구 요청·활동 제안)
    org/            동아리·조직 페이지
    chat/           채팅함(개인/활동/조직/요청), 채팅방(차단·신고)
    notifications/  알림
    profile/        프로필, 편집, 친구·팔로워·관심 목록
    settings/       설정, 공개 범위, 계정 및 안전
```

## API 교체 방법

`src/api/types.ts`의 `AroundUApi` 인터페이스를 구현하는 객체를 만들고 `src/api/index.ts`에서 `mockApi` 대신 내보내면 됩니다.
모든 변경 API는 변경된 엔티티만 담은 `Patch`를 돌려주고, 스토어가 id 기준으로 병합합니다. `subscribe()`는 서버 푸시(WebSocket/SSE)에 대응합니다.

## 프로필 질문 (`src/data/prompts.ts`)

Hinge식 구조를 캠퍼스 맥락으로 옮겼습니다.

- 텍스트 질문 3개 필수, 최대 6개 (질문 풀 21개, 6개 카테고리)
- 음성 질문 1개 선택 (데모에서는 녹음 길이만 저장)
- 투표형 질문 1개 선택 (방문자가 한 표씩 투표)
- 첫 번째 답변은 홈 사람 카드에, 전체는 프로필 상세에 표시
- 프로필 완성도 7항목을 채우면 "프로필 완성" 배지
- 온보딩 5단계에서 입력, 프로필 → 질문 답변 편집에서 수정

## 핵심 규칙 (`src/lib/relations.ts`)

- **공개 범위**: 전체 / 같은 학교 / 특정 학과·조직 / 친구 / 선택한 사람만 / 비공개 — 활동·게시물·프로필 항목별 적용
- **메시지 조건**: 친구 · 상호 관심 · 활동 참가 승인 · 제안 수락 중 하나가 성립해야 대화 가능 + 차단·수신 설정 확인
- **관심 ♥**: 상대에게 공개되지 않으며 서로 표시했을 때만 매칭 안내
- **친구 요청 거절 / 제안 거절**: 요청자에게 알림·사유를 보내지 않음
- **지도**: 사용자 위치는 표시하지 않고 활동 장소만 표시

## 데모 편의 기능 (mock 전용)

- 지민·하나·유나·서연에게 보낸 친구 요청은 5초 후 자동 수락
- 지민·수아·서연에게 보낸 활동 제안은 5초 후 자동 수락
- 우진·하나가 주최한 승인제 활동은 참가 신청 5초 후 자동 승인
- 1:1 채팅에서 메시지를 보내면 2~3초 후 상대가 답장
- 설정 → 데모 도구 → **오류 상태 미리보기**로 오류 화면 확인

## 아직 구현되지 않은 것

- 실제 백엔드·인증·이메일 발송, 실제 사진 업로드(이모지 카드로 대체)
- 쇼츠/짧은 영상, 완전한 시간표 연동, 유료 광고, 정교한 AI 추천, 직장인 모드(데이터 모델만 확장 가능하게 설계)
- 활동 시작 전 푸시 알림 스케줄링, 활동 주최자·참가자 평가/후기(구조만 예약)
- 조직 페이지 생성·편집 UI, 조직 가입 승인 처리
