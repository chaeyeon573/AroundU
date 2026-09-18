/** 프로필 질문 풀. Hinge식 구조: 텍스트 3개 필수 + 음성 1개·투표 1개 선택 */
export type PromptCategory = 'activity' | 'campus' | 'time' | 'style' | 'connect' | 'me';

export const PROMPT_CATEGORY_LABELS: Record<PromptCategory, string> = {
  activity: '함께할 활동', campus: '캠퍼스·동네', time: '시간·리듬', style: '함께하기 스타일', connect: '연결 고리', me: '나에 대해',
};

export interface PromptQuestion { id: string; text: string; category: PromptCategory; placeholder?: string }

export const TEXT_PROMPTS: PromptQuestion[] = [
  { id: 'q_now', text: '지금 당장 같이 하고 싶은 건', category: 'activity', placeholder: '예: 정문 카페에서 커피 한 잔' },
  { id: 'q_hobby', text: '혼자 하기 아까운 취미 하나', category: 'activity', placeholder: '예: 보드게임, 클라이밍' },
  { id: 'q_into', text: '요즘 꽂힌 것', category: 'activity', placeholder: '음악, 유튜브, 책, 게임 뭐든' },
  { id: 'q_always', text: '같이 가자고 하면 무조건 나가는 것', category: 'activity' },
  { id: 'q_after_exam', text: '시험 끝나면 제일 먼저 하고 싶은 것', category: 'activity' },
  { id: 'q_cafe', text: '학교 근처 내 최애 카페 / 밥집', category: 'campus' },
  { id: 'q_spot', text: '학교에서 가장 좋아하는 자리', category: 'campus' },
  { id: 'q_tip', text: '우리 학교 사람만 아는 꿀팁 하나', category: 'campus' },
  { id: 'q_3hours', text: '학교 근처에서 3시간 비면', category: 'campus', placeholder: '예: 백양로 산책하고 중도 카페' },
  { id: 'q_morning', text: '나는 아침형 / 밤형', category: 'time' },
  { id: 'q_gap', text: '공강 시간엔 보통', category: 'time' },
  { id: 'q_free_day', text: '이번 주 가장 한가한 요일은', category: 'time' },
  { id: 'q_first_meet', text: '처음 만나면 이런 활동이 제일 편해요', category: 'style' },
  { id: 'q_study_type', text: '스터디할 때 나는 이런 타입', category: 'style', placeholder: '조용히 / 토론 / 카페 / 도서관' },
  { id: 'q_role', text: '모임에서 나는 주로 이런 역할', category: 'style' },
  { id: 'q_want_person', text: '이런 사람이면 같이하고 싶어요', category: 'connect' },
  { id: 'q_project', text: '요즘 하는 프로젝트·연구·준비', category: 'connect' },
  { id: 'q_ask_me', text: '나한테 물어보면 잘 알려줄 수 있는 것', category: 'connect' },
  { id: 'q_life', text: '내 인생 활동 하나', category: 'me' },
  { id: 'q_new', text: '최근에 새로 시작한 것', category: 'me' },
  { id: 'q_emoji', text: '나를 설명하는 이모지 세 개', category: 'me', placeholder: '☕📚🏃' },
];

export const VOICE_PROMPTS: PromptQuestion[] = [
  { id: 'v_now', text: '지금 같이 하고 싶은 걸 30초로 말해주세요', category: 'activity' },
  { id: 'v_campus', text: '우리 학교 근처 추천 코스를 소개해주세요', category: 'campus' },
  { id: 'v_hello', text: '처음 만나는 사람에게 인사 한마디', category: 'me' },
  { id: 'v_weekend', text: '이번 주말 계획을 말해주세요', category: 'time' },
  { id: 'v_song', text: '요즘 가장 많이 듣는 노래 흥얼거리기', category: 'me' },
];

export interface PollQuestion { id: string; text: string; options: string[] }
export const POLL_PROMPTS: PollQuestion[] = [
  { id: 'p_gap', text: '공강엔', options: ['카페', '도서관', '산책'] },
  { id: 'p_first', text: '처음 만나면', options: ['커피', '밥', '같이 운동'] },
  { id: 'p_study', text: '시험 기간 나는', options: ['중도 붙박이', '카페 노마드', '집에서 벼락치기'] },
  { id: 'p_weekend', text: '주말에 부르면', options: ['바로 나감', '집이 좋아', '전시·공연이면 나감'] },
  { id: 'p_meal', text: '학식 vs 배달 vs 정문 맛집', options: ['학식', '배달', '정문 맛집'] },
];

export const questionById = (id: string) => TEXT_PROMPTS.find((q) => q.id === id) ?? VOICE_PROMPTS.find((q) => q.id === id);
export const pollById = (id: string) => POLL_PROMPTS.find((q) => q.id === id);

export const REQUIRED_TEXT_PROMPTS = 3;
export const MAX_TEXT_PROMPTS = 6;

/** 프로필 완성도 계산 */
export function profileCompletion(u: { prompts: { answer: string }[]; voicePrompt?: unknown; poll?: unknown; bio: string; interests: unknown[]; likes: string; freeTime: string }) {
  const items = [
    { key: 'photo', label: '프로필 사진', done: true },
    { key: 'bio', label: '자기소개', done: u.bio.trim().length > 0 },
    { key: 'interests', label: '관심사', done: u.interests.length > 0 },
    { key: 'prompts', label: `질문 답변 ${REQUIRED_TEXT_PROMPTS}개`, done: u.prompts.filter((p) => p.answer.trim()).length >= REQUIRED_TEXT_PROMPTS },
    { key: 'voice', label: '음성 질문', done: !!u.voicePrompt },
    { key: 'poll', label: '투표형 질문', done: !!u.poll },
    { key: 'likes', label: '좋아하는 것', done: u.likes.trim().length > 0 },
  ];
  const done = items.filter((i) => i.done).length;
  return { items, done, total: items.length, percent: Math.round((done / items.length) * 100), complete: done === items.length };
}
