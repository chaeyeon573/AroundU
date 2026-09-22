// ─── 공통 ────────────────────────────────────────────────────────────────
export type ID = string;

/** 항목별 공개 범위 */
export type Visibility = 'public' | 'school' | 'department' | 'friends' | 'selected' | 'private';

/** 활동 가능한 시간 (완전한 시간표 대신 사용) */
export type Availability = 'now' | 'afternoon' | 'after18' | 'weekend' | 'in_class' | 'hidden';

export type Interest =
  | 'coffee' | 'meal' | 'study' | 'exercise' | 'walk' | 'cycling' | 'shopping'
  | 'exhibition' | 'club' | 'research' | 'startup' | 'networking' | 'etc';

export type Purpose = 'friend' | 'dating' | 'study' | 'hobby' | 'club' | 'networking' | 'any';

export type Gender = 'female' | 'male' | 'other' | 'private';

// ─── 사용자 ───────────────────────────────────────────────────────────────
/** 소속 유형 — 현재 MVP는 university만 사용, 향후 company(직장인 모드) 확장 */
export type AffiliationType = 'university' | 'company';
export type UniversityRole = 'undergraduate' | 'graduate' | 'alumni';

export interface UniversityAffiliation {
  type: 'university';
  schoolId: ID;
  schoolName: string;
  role: UniversityRole;
  department: string;
  /** 입학 또는 졸업 연도 */
  year: number;
  emailVerified: boolean;
  /** 학교명 / 학과 공개 여부 */
  showSchool: boolean;
  showDepartment: boolean;
}

export interface CompanyAffiliation {
  type: 'company';
  companyName: string;
  jobTitle?: string;
  emailVerified: boolean;
}

export type Affiliation = UniversityAffiliation | CompanyAffiliation;

export type ProfileField = 'bio' | 'likes' | 'freeTime' | 'height' | 'availability' | 'preferredPartner' | 'purposes' | 'interests' | 'posts' | 'prompts' | 'timetable';

/** 시간표 수업. 요일 0=월 … 6=일 */
export interface Course {
  id: ID;
  name: string;
  day: number;
  start: string;
  end: string;
  /** 강의실 — 본인에게만 보이며 절대 공개되지 않는다 */
  room?: string;
  professor?: string;
  hue: number;
}

/** 프로필 질문(텍스트) — 질문 풀에서 골라 짧게 답한다 */
export interface ProfilePrompt {
  questionId: string;
  answer: string;
}
/** 음성 질문 — 데모에서는 녹음 길이만 저장 */
export interface VoicePrompt {
  questionId: string;
  durationSec: number;
  recordedAt: string;
}
/** 투표형 질문 — 방문자가 한 표씩 던질 수 있다 */
export interface PollPrompt {
  questionId: string;
  options: string[];
  /** 본인이 고른 답 */
  ownChoice: number;
  votes: Record<ID, number>;
}

export interface User {
  id: ID;
  nickname: string;
  birthYear: number;
  gender: Gender;
  avatar: { emoji: string; hue: number; photoType: 'face' | 'masked' | 'back' };
  identityVerified: boolean;
  affiliation: Affiliation;
  bio: string;
  likes: string;
  freeTime: string;
  height?: number;
  availability: Availability;
  interests: Interest[];
  purposes: Purpose[];
  preferredPartner?: string;
  /** 정확한 위치 대신 대략적인 지역 */
  region: string;
  /** 지금 하고 싶은 활동 (한 줄) */
  nowWant?: string;
  /** 프로필 질문 답변 (텍스트 3개 필수) */
  prompts: ProfilePrompt[];
  voicePrompt?: VoicePrompt;
  poll?: PollPrompt;
  /** 시간표 — 다른 사용자에게는 공강 여부만 공개된다 */
  timetable: Course[];
  fieldVisibility: Record<ProfileField, Visibility>;
  settings: {
    messagePolicy: 'connected' | 'friends_only' | 'none';
    notifications: boolean;
    locationPermission: 'granted' | 'denied' | 'undecided';
  };
  createdAt: string;
}

export interface School {
  id: ID;
  name: string;
  emailDomain: string;
  region: string;
  center: { lat: number; lng: number };
}

// ─── 조직 (동아리·학과·연구실·학생회) ──────────────────────────────────────
export type OrganizationType = 'club' | 'department' | 'lab' | 'council';

export interface Organization {
  id: ID;
  name: string;
  logo: { emoji: string; hue: number };
  type: OrganizationType;
  schoolId: ID;
  parent?: string;
  verified: boolean;
  description: string;
  gallery: { emoji: string; hue: number; caption: string }[];
  regularActivities: string[];
  recruitment?: { title: string; period: string; open: boolean };
  notices: { id: ID; title: string; body: string; createdAt: string }[];
  followerIds: ID[];
  memberIds: ID[];
  adminIds: ID[];
  applicantIds: ID[];
}

// ─── 활동 ─────────────────────────────────────────────────────────────────
export type ActivityKind = 'personal' | 'group' | 'org_event';
export type ActivityCategory =
  | 'coffee' | 'meal' | 'study' | 'exercise' | 'club' | 'performance'
  | 'school_event' | 'seminar' | 'networking' | 'store_deal' | 'etc';
export type JoinPolicy = 'open' | 'approval' | 'invite';

export interface Place {
  name: string;
  address?: string;
  lat: number;
  lng: number;
}

export interface Comment {
  id: ID;
  authorId: ID;
  text: string;
  createdAt: string;
}

export interface Activity {
  id: ID;
  kind: ActivityKind;
  category: ActivityCategory;
  title: string;
  description: string;
  cover: { emoji: string; hue: number };
  hostId: ID;
  hostType: 'user' | 'org';
  orgId?: ID;
  /** ISO date (YYYY-MM-DD) */
  date: string;
  startTime: string;
  endTime: string;
  place: Place;
  capacity: number;
  visibility: Visibility;
  /** visibility === 'selected' | 'department' 일 때 대상 */
  visibilityTargets?: string[];
  joinPolicy: JoinPolicy;
  fee: number;
  conditions?: string;
  invitedIds?: ID[];
  comments: Comment[];
  /** 학교 공식 행사 여부 */
  official?: boolean;
  createdAt: string;
}

export type ParticipationStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface Participation {
  id: ID;
  activityId: ID;
  userId: ID;
  status: ParticipationStatus;
  message?: string;
  createdAt: string;
}

// ─── 게시물 ───────────────────────────────────────────────────────────────
export type PostCategory = 'friend' | 'school' | 'club' | 'public';

export interface Post {
  id: ID;
  authorId: ID;
  authorType: 'user' | 'org';
  orgId?: ID;
  media: { emoji: string; hue: number }[];
  text: string;
  tags: string[];
  visibility: Visibility;
  likeIds: ID[];
  savedIds: ID[];
  comments: Comment[];
  relatedActivityId?: ID;
  createdAt: string;
}

// ─── 관계 ─────────────────────────────────────────────────────────────────
export interface Relationships {
  /** 관심 ♥ — 상대에게 공개되지 않음 */
  likes: { fromId: ID; toId: ID; createdAt: string }[];
  follows: { fromId: ID; toId: ID; targetType: 'user' | 'org' }[];
  friendRequests: { id: ID; fromId: ID; toId: ID; status: 'pending' | 'accepted' | 'declined'; createdAt: string }[];
  friends: { a: ID; b: ID; since: string }[];
  blocks: { fromId: ID; toId: ID }[];
}

export type ProposalStatus = 'pending' | 'accepted' | 'declined' | 'expired';

/** 개인 활동 제안 */
export interface ActivityProposal {
  id: ID;
  fromId: ID;
  toId: ID;
  category: ActivityCategory;
  message: string;
  when: string;
  status: ProposalStatus;
  createdAt: string;
  expiresAt: string;
}

// ─── 채팅 ─────────────────────────────────────────────────────────────────
export type ChatRoomType = 'direct' | 'activity' | 'org';

export interface ChatMessage {
  id: ID;
  senderId: ID;
  text: string;
  createdAt: string;
  system?: boolean;
}

export interface ChatRoom {
  id: ID;
  type: ChatRoomType;
  memberIds: ID[];
  activityId?: ID;
  orgId?: ID;
  title?: string;
  messages: ChatMessage[];
  lastReadAt: Record<ID, string>;
  createdAt: string;
}

// ─── 알림 ─────────────────────────────────────────────────────────────────
export type NotificationType =
  | 'friend_accepted' | 'mutual_like' | 'participation_approved' | 'participation_rejected'
  | 'participation_request' | 'activity_reminder' | 'comment' | 'like' | 'follow'
  | 'org_event' | 'nearby_activity' | 'proposal' | 'proposal_result';

export interface Notification {
  id: ID;
  userId: ID;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

// ─── 신고 ─────────────────────────────────────────────────────────────────
export type ReportTargetType = 'user' | 'activity' | 'post' | 'message';

export interface Report {
  id: ID;
  reporterId: ID;
  targetType: ReportTargetType;
  targetId: ID;
  reason: string;
  createdAt: string;
}
