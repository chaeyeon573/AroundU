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

## 모바일 앱 (Expo) — `apps/mobile`

웹과 같은 도메인 코드(`packages/core`: 타입·API·mock DB·스토어·i18n·추천 로직)를 그대로 쓰는 React Native 앱입니다. 화면은 RN으로 다시 그렸고, 웹의 모든 화면(사람·발견·캠퍼스·나 탭, `+` 시트, 사람/활동/조직/공고 상세, 채팅, 알림, 설정, 시간표, 수업 공간, Plan Together, 활동·게시물 만들기, 프로필 편집)이 `apps/mobile/app/**` 에 같은 경로 이름으로 있습니다. 온보딩·지도는 아직 없고 데모 계정으로 바로 들어갑니다.

**폰에서 보기 (Windows PowerShell)** — 다른 작업 세션이 브랜치를 바꿔도 안 깨지도록 `~/AroundU-mobile` 에 따로 클론해서 실행합니다.

```powershell
.\start-mobile.ps1      # 클론/갱신 → npm install → apps/mobile 에서 expo start --tunnel
```

QR이 뜨면 폰의 **Expo Go**(App Store / Play 스토어)로 스캔합니다. tunnel 모드라 같은 Wi-Fi가 아니어도 됩니다.

**브라우저에서 보기** — 같은 RN 코드가 react-native-web으로 돌아갑니다.

```bash
cd apps/mobile
npx expo start --web                   # http://localhost:8081
npx expo export --platform web         # 정적 파일 → apps/mobile/dist
npx expo export --platform ios,android # 네이티브 번들 (CI 검증용)
```

- 앱스토어 제출은 `npx eas build --platform ios|android` (EAS 계정 필요), 스토어 등록 전에 `app.json`의 번들 ID·아이콘을 바꿉니다.
- 스타일은 `twrnc`(런타임 Tailwind)로 웹과 같은 클래스 이름·토큰(`apps/mobile/tailwind.config.js`)을 씁니다. 사진은 `apps/mobile/assets/photos` + `src/photos.ts`의 `require` 맵으로 들어갑니다.
- 저장소는 AsyncStorage를 앱 시작 시 메모리로 올려(`src/platform.ts`의 `hydrate`) core의 동기 저장소 인터페이스에 맞춥니다.
- 루트(웹)와 모바일의 React 버전이 달라서 `metro.config.js`가 react/react-dom을 항상 `apps/mobile/node_modules` 것으로 고정합니다.

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
    home/           People 카드 스와이프, 검색
    discover/       Discover (Now | Activities | Teams)
    classes/        수업 공간 (같은 수업 학생 · Study Crew)
    plans/          My Plans
    together/       Plan Together (시간 투표 만들기·투표·확정)
    timetable/      시간표 (수업 탭 → 수업 공간, 공강 탭 → Open Slot)
    map/            지도(활동 카드·상세에서 진입)
    activity/       활동 상세, 참가자 관리(승인·거절)
    create/         활동 만들기/수정, 게시물 작성
    community/      Community (Feed | Opportunities | Clubs)
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

## 앱 구조 — People | Discover | + | Campus | Me

| 탭 | 질문 | 내용 |
| --- | --- | --- |
| **People** (`src/pages/home/HomePage.tsx`) | 누구를 만날 것인가 | 한 번에 한 명 카드 스와이프. 큰 사진, 소속, 공통 관심사, 추천 이유, 가능한 시간, "지금 같이 하고 싶은 것". 왼쪽=넘기기, 오른쪽=관심(상대에게 비공개, 상호일 때만 매칭 시트). 버튼: 넘기기 / 친구로 연결 / 커피 제안 / 함께할 일. 이전 카드, 나중에 보기, 오늘 본 사람(localStorage). 필터: 전체·친구·밥·카페·공부·운동·취미·창업·프로젝트 |
| **Discover** (`src/pages/discover/DiscoverPage.tsx`, `src/lib/discover.ts`) | 무엇을 함께할 것인가 | 상단 시간표 카드(오늘 공강·시간 맞는 사람·가능한 활동 → Open Slot). **Now**: 오늘 안에 시작하는 가벼운 활동을 한 줄 카드로(작은 프로필, 무엇·언제·어디, 같이 가기), 시간 칩(지금/30분/1시간/오늘)·종류 칩, 승인제는 승인 전 대략 위치만(`place.area`), Who's free·오늘의 질문·친구들의 계획·Campus Pulse. **Activities**: 이후 활동 + 같이 가는 행사·동아리·창업 기회. **Teams**: 팀원 모집 활동, Study Crew, 해커톤·창업 기회, 동아리 모집 — 목적·역할·대면/온라인 필터, 내가 제공할 수 있는 역할 표시 |
| **+** (`src/components/layout/BottomNav.tsx`) | 새로운 활동 만들기 | 즉석 만남(30분 뒤 시작, People에서 마지막으로 본 사람 자동 초대) / 활동·약속 / 같이 시간 정하기(Plan Together) / Study Crew(수업 선택) / 팀원 모집 / 게시물 작성. 단체 글·기회 공유는 단체 페이지와 캠퍼스 › 공고에서 |
| **Campus** (`src/pages/community/CommunityPage.tsx`) | 학교의 이야기·공고·단체 | **피드**: 사진·일상·질문·익명 글. **공고**: 장학금·인턴·연구실/RA·공모전·교환학생 (같이 가는 행사·동아리 모집·팀 기회는 발견에만). **단체**: 동아리·학회·학생회·연구실·Greek → 단체 페이지 탭 소개·게시물·행사·모집·멤버 (`src/pages/org/OrgPage.tsx`) |
| **Me** (`src/pages/profile/ProfilePage.tsx`) | 나와 내 일정 | 프로필 카드·질문 답변·목표. 목록: My Plans(받은 초대·참가 대기·확정·관심 행사·팀 신청·Study Crew, `src/pages/plans/PlansPage.tsx`) / 내 시간표 / 친구 / 채팅 / 저장한 공고 / 관심 행사 / 가입한 동아리 / 활동 기록. 게시물·만든 활동·참여·저장 탭 |

시간표는 탭이 아니라 Discover 상단 카드와 Me에서 진입합니다. **수업을 탭하면 수업 공간**(`src/pages/classes/ClassPage.tsx`)이 열려 같은 수업 학생(시간표 공개 범위·같은 학교 기준)과 운영 중인 Study Crew를 보고, `Study Crew 만들기`로 제목·장소·시간(수업 직후)·공개 범위(같은 수업만, `visibilityTargets: ['course:<수업명>']`)가 미리 채워진 생성 화면으로 갑니다. 유형(시험·과제·복습·팀플)과 대면/온라인만 고르면 됩니다.

**Plan Together** (`src/pages/together/*`, `src/lib/together.ts`, `api.together`): 단체 약속 시간 투표. `+` › 같이 시간 정하기 → 무엇(카테고리·제목·장소) → 누구(친구 다중 선택) → 언제(주최자·초대자 시간표의 공강이 겹치는 시간을 자동 제안 + 직접 추가) → 마감(24/48/72시간) → 보내기. 초대받은 사람은 되는 시간을 모두 고르고, 주최자는 표가 많은 시간으로 확정 → 활동(초대제)과 그룹 채팅방이 생성되고 그 시간에 가능하다고 한 사람만 참가자로 들어간다. 전체 시간표는 공유되지 않고 각자 고른 시간만 보인다. Me › My Plans "시간 정하는 중", Discover › Now "친구들의 계획", 알림에서 진입. 데모에서는 초대받은 사람이 4~7초 뒤 자기 공강에 맞춰 자동 투표.

**발견 › 활동 피드는 글만**: 활동·행사 카드는 사진 없이 이모지 타일 + 제목·설명·언제·어디서·인원·참가비·주최자만 보인다 (`ActivityCard`/`OpportunityCard`의 `variant="text"`). 사진은 커뮤니티 Feed의 개인 포스트와 상세 화면에서만.

**개인 포스트** (`src/pages/create/CreatePostPage.tsx`, `src/components/cards/PostCard.tsx`): 사진 1~4장 + 짧은 글, 종류·주제·수업 태그, 함께한 사람(상대가 승인해야 상대 프로필에 표시), 참여한 활동·관련 기회 연결, "다음 활동 같이할 사람 모집". 공개 범위는 같은 학교 / 친구 / 팔로워 / 나만 — 인터넷 전체 공개 없음. "내 프로필에 표시", "Community Feed에도 공개" 체크. 반응: 공감 / 댓글 / 나도 관심 있어요(관련 기회) / 다음에는 같이하기(작성자에게 제안) / 활동 자세히 보기 / 팀 참여 문의. 익명은 글만.

## Open Slot · 소셜 RSVP (`src/pages/plans`, `src/components/social`, `src/lib/social.ts`)

- Who's free right now?(친구·같은 행사·같은 조직·"새로운 사람에게 공개"만 노출, 남은 공강 시간만 표시), 오늘의 질문, 친구들의 계획 피드(의도 기반, 사진 없음), Campus Pulse(집계값만)는 Discover › Now 하단에. 지도는 활동 카드의 "지도" 버튼과 활동 상세에서만 열림
- Open Slot: 시간표에서 공강을 탭하면 "이 시간에 무엇을 하고 싶어요?" → 공개 범위 → 활동 생성. 그 시간에 시간이 맞는 사람과 근처 활동을 함께 보여줌. `+` 메뉴의 "내 공강 열기"와 시간표 상단 "오늘 공강에 끼워 넣을 수 있는 것"에서도 진입
- 소셜 RSVP: 관심 / 갈 예정 / 혼자 가요 / 같이 갈 사람 찾아요 / 팀 찾는 중 / 이미 신청 / 참여 경험 있음. 혼자·같이 갈 사람 찾는 사람이 "함께할 사람" 탭 상단에 오고 "같이 가기 제안"으로 연결
- 사진: `public/photos/` (MIT 템플릿 저장소의 Unsplash 계열 인물·풍경 + ImageNet 샘플 몇 장). 공개 서비스 전에는 라이선스 확인된 사진으로 교체 필요

## 한국어 / English

- 시작 화면 오른쪽 위 또는 설정 → 언어에서 전환. `src/i18n/index.ts`의 `t('한국어')`가 `src/i18n/en.ts` 사전으로 번역합니다.
- 영어 모드는 미국 캠퍼스(UC Berkeley) 시드 `src/data/seed.en.ts`를 사용합니다. Greek life(소로리티·프래터니티) 조직, .edu 인증, 달러 표기가 포함됩니다.
- mock DB는 언어별로 분리 저장됩니다 (`aroundu.mockdb.v3.ko` / `.en`).

## 이번 주 뭐 하지? · 공고 (`src/pages/opportunities`, `src/lib/recommend.ts`)

- Community › Opportunities에 나에게 맞는 / 공고 / 저장·지원 / 유형별. 행사·동아리·해커톤·창업은 Discover › Activities·Teams에도 노출되고, 장학금·인턴·연구실 공고는 목록에만 가볍게 노출. 누구나 링크·제목만으로 기회 공유 가능(`api.opportunities.create`)
- 같이 가는 종류에만 관심 ♥ / 같이 갈래요 / 사람 찾기가 붙고, 공고류는 저장·마감 알림·지원 완료만 제공
- 관심 있음 / 지원 예정 / 지원 완료 / 저장, 마감 알림, Q&A와 후기(결과 공개 선택)
- "함께할 사람" 탭: 같은 기회에 관심 있는 사람과 왜 맞는지(역할·목표·공강·수업) 표시, 팀 제안 → 활동 생성으로 연결
- 홈 "나에게 맞는 기회"는 이번 학기 목표·관심사·제공 가능 역할·관심 조직 기준으로 점수화

## 개인 맥락과 추천 (`src/pages/profile/ProfileContextPage.tsx`)

- 온보딩에서는 이번 학기 목표와 "어떤 사람을 만나고 싶어요?"만 묻고, 찾는 사람·제공할 수 있는 것·생활권·관심 조직은 프로필에서 나중에 채움
- 프로필 완성도 11항목, 완성도가 높을수록 추천 노출 가중치(최대 1.5배)
- 사람 카드와 프로필에 구체적인 추천 이유 표시 (같은 기회, 역할 보완, 같은 수업, 공강 겹침, 같은 생활권, 공통 관심사)

## 시간표 (`src/pages/timetable`, `src/lib/timetable.ts`)

- 주간 시간표에 수업 추가·수정·삭제 (빈 칸 탭 또는 수업 추가 버튼), 색상·강의실·교수 입력
- 이번 주에 참가하는 활동을 점선 블록으로 함께 표시
- 지금 상태(수업 중·공강·오늘 수업 끝)를 자동 계산해 사람 카드와 프로필의 활동 가능 시간에 반영
- 오늘 공강이 겹치는 친구 목록과 가장 긴 겹침 시간으로 활동 만들기(시작·종료 시간 미리 채움)
- 공개 범위: 다른 사용자에게는 공강 여부만 보이고 전체 시간표와 강의실은 비공개

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
- 쇼츠/짧은 영상, 학교 수강편람 연동(시간표는 직접 입력), 유료 광고, 정교한 AI 추천, 직장인 모드(데이터 모델만 확장 가능하게 설계)
- 활동 시작 전 푸시 알림 스케줄링, 활동 주최자·참가자 평가/후기(구조만 예약)
- 조직 페이지 생성·편집 UI, 조직 가입 승인 처리
- 활동 후 "오늘 어땠어요?" 피드백(추천 가중치), 학교 LMS·캘린더 연동, Plan Together 마감 자동 처리·알림 스케줄링
