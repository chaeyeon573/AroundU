import type {
  ActivityCategory, Availability, Interest, JoinPolicy, Purpose, UniversityRole, Visibility, OrganizationType, ActivityKind, Gender,
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
