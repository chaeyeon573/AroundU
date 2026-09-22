import type {
  ActivityCategory, Availability, Interest, JoinPolicy, Purpose, UniversityRole, Visibility, OrganizationType, ActivityKind, Gender, Goal, Role, Residence, OpportunityType, MeetPreference,
} from '@/types';

export const INTEREST_LABELS: Record<Interest, string> = {
  coffee: '커피', meal: '식사', study: '공부', exercise: '운동', walk: '산책', cycling: '사이클',
  shopping: '쇼핑', exhibition: '전시·공연', club: '동아리', research: '연구·논문', startup: '창업',
  networking: '네트워킹', etc: '기타',
};
export const INTEREST_EMOJI: Record<Interest, string> = {
  coffee: '☕', meal: '🍜', study: '📚', exercise: '🏃', walk: '🚶', cycling: '🚴', shopping: '🛍️',
  exhibition: '🎨', club: '🎸', research: '🔬', startup: '🚀', networking: '🤝', etc: '✨',
};

export const PURPOSE_LABELS: Record<Purpose, string> = {
  friend: '친구', dating: '연애', study: '스터디', hobby: '취미', club: '동아리', networking: '네트워킹', any: '상관없음',
};

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  now: '지금 가능', afternoon: '오늘 오후 가능', after18: '오후 6시 이후 가능', weekend: '주말 가능',
  in_class: '현재 수업 중', hidden: '공개하지 않음',
};

export const VISIBILITY_LABELS: Record<Visibility, string> = {
  public: '전체 공개', school: '같은 학교', department: '특정 학과·조직', friends: '친구', selected: '선택한 사람만', private: '비공개',
};

export const VISIBILITY_ORDER: Visibility[] = ['public', 'school', 'department', 'friends', 'selected', 'private'];

export const CATEGORY_LABELS: Record<ActivityCategory, string> = {
  coffee: '커피', meal: '식사', study: '공부', exercise: '운동', club: '동아리', performance: '공연',
  school_event: '학교 행사', seminar: '연구·세미나', networking: '네트워킹', store_deal: '매장 혜택', etc: '기타',
};
export const CATEGORY_EMOJI: Record<ActivityCategory, string> = {
  coffee: '☕', meal: '🍽️', study: '📖', exercise: '🏃', club: '🎸', performance: '🎤', school_event: '🎓',
  seminar: '🧪', networking: '🤝', store_deal: '🏷️', etc: '✨',
};
/** 지도 마커·칩 색상 (hex) */
export const CATEGORY_COLORS: Record<ActivityCategory, string> = {
  coffee: '#C98A3B', meal: '#F0752B', study: '#3D5AFE', exercise: '#22A06B', club: '#8B5CF6', performance: '#D946A6',
  school_event: '#E5484D', seminar: '#0EA5A5', networking: '#4F46E5', store_deal: '#EAB308', etc: '#6B7280',
};

export const JOIN_POLICY_LABELS: Record<JoinPolicy, string> = {
  open: '누구나 바로 참가', approval: '주최자 승인 후 참가', invite: '초대받은 사람만 참가',
};

export const ROLE_LABELS: Record<UniversityRole, string> = { undergraduate: '학부생', graduate: '대학원생', alumni: '졸업생' };
export const ORG_TYPE_LABELS: Record<OrganizationType, string> = { club: '동아리', department: '학과', lab: '연구실', council: '학생회' };
export const KIND_LABELS: Record<ActivityKind, string> = { personal: '개인 활동', group: '그룹 모임', org_event: '동아리·학교 행사' };
export const GENDER_LABELS: Record<Gender, string> = { female: '여성', male: '남성', other: '기타', private: '비공개' };

/** 홈 활동 필터 → 카테고리 매핑 */
export const HOME_ACTIVITY_FILTERS: { key: string; label: string; categories: ActivityCategory[] | null }[] = [
  { key: 'all', label: '전체', categories: null },
  { key: 'coffee_meal', label: '커피·식사', categories: ['coffee', 'meal'] },
  { key: 'study', label: '공부', categories: ['study', 'seminar'] },
  { key: 'exercise', label: '운동', categories: ['exercise'] },
  { key: 'club', label: '동아리', categories: ['club', 'performance'] },
  { key: 'event', label: '행사', categories: ['school_event', 'performance'] },
  { key: 'networking', label: '네트워킹', categories: ['networking'] },
  { key: 'etc', label: '기타', categories: ['store_deal', 'etc'] },
];

export const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as ActivityCategory[];
export const ALL_INTERESTS = Object.keys(INTEREST_LABELS) as Interest[];
export const ALL_PURPOSES = Object.keys(PURPOSE_LABELS) as Purpose[];
export const ALL_AVAILABILITY = Object.keys(AVAILABILITY_LABELS) as Availability[];

export const GOAL_LABELS: Record<Goal, string> = {
  friends: '친구 만들기', lunch: '같이 점심 먹을 사람', join_club: '동아리 가입', start_club: '동아리 만들기', startup: '창업하기', cofounder: '공동창업자 찾기',
  lab: '연구실 지원', internship: '인턴 지원', scholarship: '장학금 신청', hackathon: '해커톤·공모전', hobby: '운동·취미 시작', dating: '데이팅',
};
export const GOAL_EMOJI: Record<Goal, string> = {
  friends: '🙌', lunch: '🍱', join_club: '🎸', start_club: '🚩', startup: '🚀', cofounder: '🤝', lab: '🔬', internship: '💼', scholarship: '🎓', hackathon: '💡', hobby: '🏃', dating: '💘',
};
export const PERSON_ROLE_LABELS: Record<Role, string> = {
  friend: '친구', teammate: '팀원', cofounder: '공동창업자', developer: '개발', designer: '디자인', data: '데이터 분석', marketing: '마케팅', planning: '기획',
  presentation: '발표', video: '영상 제작', research: '연구 경험', club_ops: '동아리 운영', study_partner: '스터디 파트너', application_partner: '지원 준비 파트너', senior: '경험 있는 선배', mentor: '멘토', date: '데이트 상대',
};
/** 찾는 사람 선택지 / 제공할 수 있는 것 선택지 */
export const LOOKING_FOR_ROLES: Role[] = ['friend', 'teammate', 'cofounder', 'developer', 'designer', 'study_partner', 'application_partner', 'senior', 'mentor', 'date'];
export const OFFER_ROLES: Role[] = ['developer', 'designer', 'data', 'marketing', 'planning', 'presentation', 'video', 'research', 'club_ops'];
export const RESIDENCE_LABELS: Record<Residence, string> = { dorm: '기숙사', offcampus: '학교 근처 자취', commute: '통학' };
export const OPP_TYPE_LABELS: Record<OpportunityType, string> = {
  event: '학교 행사', club: '동아리', lab: '연구실', internship: '인턴', scholarship: '장학금', hackathon: '해커톤·공모전', startup: '창업', activity: '활동',
};
export const OPP_TYPE_EMOJI: Record<OpportunityType, string> = { event: '🎪', club: '🎸', lab: '🔬', internship: '💼', scholarship: '🎓', hackathon: '💡', startup: '🚀', activity: '☕' };
export const OPP_TYPE_COLORS: Record<OpportunityType, string> = { event: '#E5484D', club: '#8B5CF6', lab: '#0EA5A5', internship: '#4F46E5', scholarship: '#F5A524', hackathon: '#3D5AFE', startup: '#F0752B', activity: '#C98A3B' };
export const ALL_GOALS = Object.keys(GOAL_LABELS) as Goal[];
export const ALL_OPP_TYPES = Object.keys(OPP_TYPE_LABELS) as OpportunityType[];
export const MEET_PREF_LABELS: Record<MeetPreference, string> = {
  same_hobby: '취미·관심사가 같은 사람', same_class: '같은 수업을 듣는 사람', same_goal: '같은 목표를 준비하는 사람', same_living: '생활권이 가까운 사람', new_people: '나와 다른 분야의 새로운 사람',
};
export const MEET_PREF_EMOJI: Record<MeetPreference, string> = { same_hobby: '🎨', same_class: '📚', same_goal: '🎯', same_living: '🏠', new_people: '🌍' };
export const ALL_MEET_PREFS = Object.keys(MEET_PREF_LABELS) as MeetPreference[];
