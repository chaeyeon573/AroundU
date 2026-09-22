import type { AroundUApi, Patch, Snapshot } from '../types';
import { t } from '@/i18n';
import type {
  Activity, ActivityProposal, ChatRoom, ID, Notification, Participation, Post, User, Opportunity, TimePoll,
} from '@/types';
import { freeBlocks, jsDayToIdx, toMin } from '@/lib/timetable';
import { loadDB, resetDB, saveDB, getSession, setSession, type MockDB } from './db';
import { DEMO_USER_ID } from '@/data/seed';
import { uid, pairKey } from '@/lib/format';
import { CATEGORY_LABELS } from '@/lib/labels';
import { canMessage } from '@/lib/relations';

let db: MockDB = loadDB();
let failNextRequest = false;
const listeners = new Set<(patch: Patch) => void>();

/** 데모용 자동 응답 대상 — 실제 서버에서는 상대 사용자의 행동으로 대체된다 */
const AUTO_ACCEPT_FRIEND = new Set(['u_jimin', 'u_hana', 'u_yuna', 'u_seoyeon']);
const AUTO_ACCEPT_PROPOSAL = new Set(['u_jimin', 'u_sua', 'u_seoyeon']);
const AUTO_APPROVE_HOSTS = new Set(['u_woojin', 'u_hana']);
const REPLIES = [t('좋아요! 언제 만날까요?'), t('ㅋㅋㅋ 그러게요'), t('저도 그 생각 했어요'), t('알겠어요, 이따 봐요 :)'), t('오 좋다 👍')];

const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms + Math.random() * 200));

async function request<T>(fn: () => T): Promise<T> {
  await delay();
  if (failNextRequest) {
    failNextRequest = false;
    throw new Error(t('네트워크 연결이 불안정해요. 잠시 후 다시 시도해주세요.'));
  }
  const result = fn();
  saveDB(db);
  return result;
}

function push(patch: Patch) {
  saveDB(db);
  listeners.forEach((l) => l(patch));
}

const find = <T extends { id: ID }>(arr: T[], id: ID) => {
  const x = arr.find((i) => i.id === id);
  if (!x) throw new Error(t('항목을 찾을 수 없어요.'));
  return x;
};

function notify(userId: ID, n: Omit<Notification, 'id' | 'userId' | 'read' | 'createdAt'>): Notification {
  const nt: Notification = { id: uid('nt'), userId, read: false, createdAt: new Date().toISOString(), ...n };
  db.notifications.unshift(nt);
  return nt;
}

function ensureActivityRoom(activity: Activity): ChatRoom {
  let room = db.chatRooms.find((r) => r.type === 'activity' && r.activityId === activity.id);
  if (!room) {
    room = {
      id: uid('cr'), type: 'activity', activityId: activity.id, memberIds: [activity.hostId], title: activity.title,
      messages: [{ id: uid('m'), senderId: activity.hostId, text: t('활동 그룹 채팅방이 열렸어요.'), createdAt: new Date().toISOString(), system: true }],
      lastReadAt: {}, createdAt: new Date().toISOString(),
    };
    db.chatRooms.push(room);
  }
  return room;
}

function addToRoom(room: ChatRoom, userId: ID) {
  if (!room.memberIds.includes(userId)) {
    room.memberIds.push(userId);
    const user = find(db.users, userId);
    room.messages.push({ id: uid('m'), senderId: userId, text: `${user.nickname}${t('님이 입장했어요.')}`, createdAt: new Date().toISOString(), system: true });
  }
}

function ensureDirectRoom(a: ID, b: ID): ChatRoom {
  let room = db.chatRooms.find((r) => r.type === 'direct' && r.memberIds.length === 2 && r.memberIds.includes(a) && r.memberIds.includes(b));
  if (!room) {
    room = { id: uid('cr'), type: 'direct', memberIds: [a, b], messages: [], lastReadAt: {}, createdAt: new Date().toISOString() };
    db.chatRooms.push(room);
  }
  return room;
}

function approveParticipation(p: Participation): Patch {
  p.status = 'approved';
  const activity = find(db.activities, p.activityId);
  const room = ensureActivityRoom(activity);
  addToRoom(room, p.userId);
  const nts: Notification[] = [];
  if (p.userId === DEMO_USER_ID) {
    nts.push(notify(DEMO_USER_ID, { type: 'participation_approved', title: t('참가가 승인되었어요'), body: `"${activity.title}${t('" 그룹 채팅방에 입장할 수 있어요.')}`, link: `/chats/${room.id}` }));
  }
  return { participations: [p], chatRooms: [room], notifications: nts };
}

function acceptFriend(reqId: ID): Patch {
  const req = find(db.relationships.friendRequests, reqId);
  req.status = 'accepted';
  db.relationships.friends.push({ a: req.fromId, b: req.toId, since: new Date().toISOString() });
  const nts: Notification[] = [];
  // 수락된 경우에만 요청자에게 알림
  const other = find(db.users, req.toId);
  if (req.fromId === DEMO_USER_ID) {
    nts.push(notify(DEMO_USER_ID, { type: 'friend_accepted', title: t('친구 요청이 수락되었어요'), body: `${other.nickname}${t('님과 친구가 되었어요. 이제 메시지를 보낼 수 있어요.')}`, link: `/users/${other.id}` }));
  }
  return { relationships: db.relationships, notifications: nts };
}

export const mockApi: AroundUApi = {
  auth: {
    async loginDemo() {
      return request(() => { setSession(DEMO_USER_ID); return find(db.users, DEMO_USER_ID); });
    },
    async register(input) {
      return request(() => {
        const school = find(db.schools, input.schoolId);
        const user: User = {
          id: uid('u'), nickname: input.nickname, birthYear: input.birthYear, gender: input.gender, avatar: input.avatar,
          identityVerified: false,
          affiliation: {
            type: 'university', schoolId: school.id, schoolName: school.name, role: input.role, department: input.department, year: input.year,
            emailVerified: input.emailVerified, showSchool: input.showSchool, showDepartment: input.showDepartment,
          },
          bio: input.bio, likes: input.likes, freeTime: input.freeTime, height: input.height, availability: input.availability,
          interests: input.interests, purposes: input.purposes, preferredPartner: input.preferredPartner, region: school.region,
          prompts: input.prompts, voicePrompt: input.voicePrompt, poll: input.poll, timetable: input.timetable ?? [],
          goals: input.goals, lookingFor: input.lookingFor ?? [], canOffer: input.canOffer ?? [], living: input.living, interestedOrgIds: [], meetPreference: input.meetPreference ?? [],
          fieldVisibility: input.fieldVisibility,
          settings: { messagePolicy: 'connected', notifications: input.notifications, locationPermission: input.locationPermission },
          createdAt: new Date().toISOString(),
        };
        db.users.push(user);
        notify(user.id, { type: 'nearby_activity', title: t('AroundU에 오신 걸 환영해요'), body: t('학교 주변에서 열리는 활동을 홈에서 확인해보세요.'), link: '/' });
        setSession(user.id);
        return user;
      });
    },
    async logout() { setSession(null); },
    async session() { return getSession(); },
  },

  async bootstrap(viewerId) {
    return request<Snapshot>(() => {
      find(db.users, viewerId);
      // 만료된 제안 처리
      const now = Date.now();
      db.proposals.forEach((p) => { if (p.status === 'pending' && new Date(p.expiresAt).getTime() < now) p.status = 'expired'; });
      const { version: _v, seededOn: _s, ...snapshot } = db;
      return structuredClone(snapshot);
    });
  },

  schools: {
    async search(query) {
      return request(() => db.schools.filter((s) => !query || s.name.includes(query) || s.region.includes(query)));
    },
    async sendVerificationCode(email, schoolId) {
      return request(() => {
        const school = find(db.schools, schoolId);
        const ok = email.toLowerCase().endsWith(`@${school.emailDomain}`);
        return { ok, hint: ok ? t('데모 인증 코드: 123456') : `@${school.emailDomain}${t(' 이메일만 사용할 수 있어요.')}` };
      });
    },
    async verifyCode(_email, code) {
      return request(() => ({ ok: code.trim() === '123456' }));
    },
  },

  users: {
    async update(id, patch) {
      return request(() => { const u = find(db.users, id); Object.assign(u, patch); return { users: [u] }; });
    },
    async setAvailability(id, availability) {
      return request(() => { const u = find(db.users, id); u.availability = availability; return { users: [u] }; });
    },
    async votePoll(ownerId, voterId, optionIndex) {
      return request(() => {
        const u = find(db.users, ownerId);
        if (!u.poll) throw new Error(t('투표형 질문이 없어요.'));
        u.poll.votes[voterId] = optionIndex;
        return { users: [u] };
      });
    },
  },

  activities: {
    async create(hostId, input) {
      return request(() => {
        const activity: Activity = {
          id: uid('a'), hostId, hostType: input.orgId ? 'org' : 'user', comments: [], createdAt: new Date().toISOString(), ...input,
        };
        db.activities.unshift(activity);
        const room = ensureActivityRoom(activity);
        // 초대된 사람은 바로 참가자로 등록
        const parts: Participation[] = (input.invitedIds ?? []).map((userId) => {
          const p: Participation = { id: uid('p'), activityId: activity.id, userId, status: 'approved', createdAt: new Date().toISOString() };
          db.participations.push(p);
          addToRoom(room, userId);
          return p;
        });
        return { activity, patch: { activities: [activity], chatRooms: [room], participations: parts } };
      });
    },
    async update(id, input) {
      return request(() => {
        const a = find(db.activities, id);
        Object.assign(a, input);
        const room = db.chatRooms.find((r) => r.activityId === id);
        if (room) room.title = a.title;
        return { activities: [a], chatRooms: room ? [room] : [] };
      });
    },
    async remove(id) {
      return request(() => {
        db.activities = db.activities.filter((a) => a.id !== id);
        const removedParts = db.participations.filter((p) => p.activityId === id).map((p) => p.id);
        db.participations = db.participations.filter((p) => p.activityId !== id);
        const rooms = db.chatRooms.filter((r) => r.activityId === id).map((r) => r.id);
        db.chatRooms = db.chatRooms.filter((r) => r.activityId !== id);
        db.posts.forEach((p) => { if (p.relatedActivityId === id) delete p.relatedActivityId; });
        return { posts: db.posts.filter((p) => !p.relatedActivityId), removed: { activities: [id], participations: removedParts, chatRooms: rooms } };
      });
    },
    async join(activityId, userId, message) {
      return request(() => {
        const activity = find(db.activities, activityId);
        const existing = db.participations.find((p) => p.activityId === activityId && p.userId === userId && p.status !== 'cancelled' && p.status !== 'rejected');
        if (existing) return { participations: [existing] };
        const approvedCount = db.participations.filter((p) => p.activityId === activityId && p.status === 'approved').length;
        if (activity.joinPolicy === 'invite' && !(activity.invitedIds ?? []).includes(userId)) throw new Error(t('초대받은 사람만 참가할 수 있는 활동이에요.'));
        if (approvedCount >= activity.capacity) throw new Error(t('모집 인원이 모두 찼어요.'));
        const p: Participation = { id: uid('p'), activityId, userId, status: activity.joinPolicy === 'open' ? 'approved' : 'pending', message, createdAt: new Date().toISOString() };
        db.participations.push(p);
        if (p.status === 'approved') {
          const room = ensureActivityRoom(activity);
          addToRoom(room, userId);
          return { participations: [p], chatRooms: [room] };
        }
        // 데모: 일부 주최자는 잠시 후 자동 승인
        if (AUTO_APPROVE_HOSTS.has(activity.hostId)) {
          setTimeout(() => { if (p.status === 'pending') push(approveParticipation(p)); }, 5000);
        }
        return { participations: [p] };
      });
    },
    async cancel(activityId, userId) {
      return request(() => {
        const p = db.participations.find((x) => x.activityId === activityId && x.userId === userId && (x.status === 'approved' || x.status === 'pending'));
        if (!p) return {};
        p.status = 'cancelled';
        const room = db.chatRooms.find((r) => r.activityId === activityId);
        if (room) room.memberIds = room.memberIds.filter((m) => m !== userId);
        return { participations: [p], chatRooms: room ? [room] : [] };
      });
    },
    async approve(participationId) {
      return request(() => approveParticipation(find(db.participations, participationId)));
    },
    async reject(participationId) {
      return request(() => {
        const p = find(db.participations, participationId);
        p.status = 'rejected';
        const nts: Notification[] = [];
        if (p.userId === DEMO_USER_ID) {
          const activity = find(db.activities, p.activityId);
          nts.push(notify(DEMO_USER_ID, { type: 'participation_rejected', title: t('이번 활동은 성사되지 않았어요'), body: `"${activity.title}${t('" 참가가 승인되지 않았어요.')}`, link: `/activities/${activity.id}` }));
        }
        return { participations: [p], notifications: nts };
      });
    },
    async comment(activityId, authorId, text) {
      return request(() => {
        const a = find(db.activities, activityId);
        a.comments.push({ id: uid('c'), authorId, text, createdAt: new Date().toISOString() });
        return { activities: [a] };
      });
    },
  },

  posts: {
    async create(authorId, input) {
      return request(() => {
        const post: Post = { id: uid('po'), authorId, authorType: input.orgId ? 'org' : 'user', likeIds: [], savedIds: [], comments: [], createdAt: new Date().toISOString(), showOnProfile: true, showOnFeed: true, ...input };
        if (post.anonymous) { post.media = []; post.taggedUserIds = []; }
        db.posts.unshift(post);
        const author = find(db.users, authorId);
        // 데모: 태그된 사람은 잠시 후 자동 승인
        (post.taggedUserIds ?? []).forEach((uid2) => {
          if (uid2 !== DEMO_USER_ID) setTimeout(() => { post.tagApprovedIds = [...new Set([...(post.tagApprovedIds ?? []), uid2])]; push({ posts: [post] }); }, 4000);
        });
        if ((post.taggedUserIds ?? []).includes(DEMO_USER_ID) && authorId !== DEMO_USER_ID) notify(DEMO_USER_ID, { type: 'comment', title: t('게시물에 태그되었어요'), body: `${author.nickname}${t('님이 함께한 사람으로 태그했어요. 승인하면 내 프로필에도 보여요.')}`, link: '/community' });
        return { post, patch: { posts: [post] } };
      });
    },
    async remove(id) {
      return request(() => { db.posts = db.posts.filter((p) => p.id !== id); return { removed: { posts: [id] } }; });
    },
    async toggleLike(postId, userId) {
      return request(() => {
        const p = find(db.posts, postId);
        p.likeIds = p.likeIds.includes(userId) ? p.likeIds.filter((i) => i !== userId) : [...p.likeIds, userId];
        return { posts: [p] };
      });
    },
    async toggleSave(postId, userId) {
      return request(() => {
        const p = find(db.posts, postId);
        p.savedIds = p.savedIds.includes(userId) ? p.savedIds.filter((i) => i !== userId) : [...p.savedIds, userId];
        return { posts: [p] };
      });
    },
    async comment(postId, authorId, text) {
      return request(() => {
        const p = find(db.posts, postId);
        p.comments.push({ id: uid('c'), authorId, text, createdAt: new Date().toISOString() });
        return { posts: [p] };
      });
    },
    async approveTag(postId, userId, approve) {
      return request(() => {
        const p = find(db.posts, postId);
        const set = new Set(p.tagApprovedIds ?? []);
        if (approve) set.add(userId); else { set.delete(userId); p.taggedUserIds = (p.taggedUserIds ?? []).filter((i) => i !== userId); }
        p.tagApprovedIds = [...set];
        return { posts: [p] };
      });
    },
  },

  relationships: {
    async toggleLike(fromId, toId) {
      return request(() => {
        const r = db.relationships;
        const exists = r.likes.find((l) => l.fromId === fromId && l.toId === toId);
        let mutual = false;
        const nts: Notification[] = [];
        if (exists) {
          r.likes = r.likes.filter((l) => l !== exists);
        } else {
          r.likes.push({ fromId, toId, createdAt: new Date().toISOString() });
          mutual = r.likes.some((l) => l.fromId === toId && l.toId === fromId);
          if (mutual) {
            const other = find(db.users, toId);
            nts.push(notify(fromId, { type: 'mutual_like', title: t('서로 관심이 있어요'), body: `${other.nickname}${t('님과 서로 관심이 있어요. 이제 메시지를 보낼 수 있어요.')}`, link: `/users/${toId}` }));
          }
        }
        return { patch: { relationships: r, notifications: nts }, mutual };
      });
    },
    async toggleFollow(fromId, toId, targetType) {
      return request(() => {
        const r = db.relationships;
        const exists = r.follows.find((f) => f.fromId === fromId && f.toId === toId);
        r.follows = exists ? r.follows.filter((f) => f !== exists) : [...r.follows, { fromId, toId, targetType }];
        const orgs = [];
        if (targetType === 'org') {
          const org = find(db.organizations, toId);
          org.followerIds = exists ? org.followerIds.filter((i) => i !== fromId) : [...org.followerIds, fromId];
          orgs.push(org);
        }
        return { relationships: r, organizations: orgs };
      });
    },
    async sendFriendRequest(fromId, toId) {
      return request(() => {
        const r = db.relationships;
        if (r.friendRequests.some((q) => q.fromId === fromId && q.toId === toId && q.status === 'pending')) return { relationships: r };
        const req = { id: uid('fr'), fromId, toId, status: 'pending' as const, createdAt: new Date().toISOString() };
        r.friendRequests.push(req);
        if (AUTO_ACCEPT_FRIEND.has(toId)) setTimeout(() => { if (req.status === 'pending') push(acceptFriend(req.id)); }, 5000);
        return { relationships: r };
      });
    },
    async cancelFriendRequest(requestId) {
      return request(() => {
        db.relationships.friendRequests = db.relationships.friendRequests.filter((q) => q.id !== requestId);
        return { relationships: db.relationships };
      });
    },
    async respondFriendRequest(requestId, accept) {
      return request(() => {
        if (accept) return acceptFriend(requestId);
        const req = find(db.relationships.friendRequests, requestId);
        req.status = 'declined'; // 거절 알림은 보내지 않음
        return { relationships: db.relationships };
      });
    },
    async unfriend(a, b) {
      return request(() => {
        const k = pairKey(a, b);
        db.relationships.friends = db.relationships.friends.filter((f) => pairKey(f.a, f.b) !== k);
        return { relationships: db.relationships };
      });
    },
    async block(fromId, toId) {
      return request(() => {
        const r = db.relationships;
        if (!r.blocks.some((b) => b.fromId === fromId && b.toId === toId)) r.blocks.push({ fromId, toId });
        const k = pairKey(fromId, toId);
        r.friends = r.friends.filter((f) => pairKey(f.a, f.b) !== k);
        r.follows = r.follows.filter((f) => !(f.fromId === fromId && f.toId === toId) && !(f.fromId === toId && f.toId === fromId));
        r.likes = r.likes.filter((l) => !(l.fromId === fromId && l.toId === toId) && !(l.fromId === toId && l.toId === fromId));
        r.friendRequests = r.friendRequests.filter((q) => pairKey(q.fromId, q.toId) !== k);
        return { relationships: r };
      });
    },
    async unblock(fromId, toId) {
      return request(() => {
        db.relationships.blocks = db.relationships.blocks.filter((b) => !(b.fromId === fromId && b.toId === toId));
        return { relationships: db.relationships };
      });
    },
  },

  orgs: {
    async apply(orgId, userId) {
      return request(() => {
        const org = find(db.organizations, orgId);
        if (!org.applicantIds.includes(userId) && !org.memberIds.includes(userId)) org.applicantIds.push(userId);
        return { organizations: [org] };
      });
    },
  },

  opportunities: {
    async create(authorId, input) {
      return request(() => {
        const author = find(db.users, authorId);
        const o: Opportunity = {
          id: uid('op'), type: input.type, title: input.title, host: input.host || author.nickname, orgId: input.orgId, description: input.description,
          cover: { emoji: { event: '🎪', club: '🎸', lab: '🔬', internship: '💼', scholarship: '🎓', hackathon: '💡', startup: '🚀', activity: '☕', exchange: '✈️' }[input.type], hue: 200 },
          deadline: input.deadline, date: input.date, eligibility: t('누구나'), rolesNeeded: input.rolesNeeded, sourceUrl: input.sourceUrl, sourceLabel: input.sourceUrl ? t('공유된 링크') : '',
          tags: [], interests: [], goals: [], schoolId: author.affiliation.type === 'university' ? author.affiliation.schoolId : undefined, lastVerified: new Date().toISOString().slice(0, 10), qna: [], reviews: [], createdAt: new Date().toISOString(),
        };
        db.opportunities.unshift(o);
        const rec = { id: uid('oi'), opportunityId: o.id, userId: authorId, intent: 'interested' as const, saved: true, createdAt: new Date().toISOString() };
        db.opportunityIntents.push(rec);
        return { opportunity: o, patch: { opportunities: [o], opportunityIntents: [rec] } };
      });
    },
    async setIntent(opportunityId, userId, intent) {
      return request(() => {
        const existing = db.opportunityIntents.find((i) => i.opportunityId === opportunityId && i.userId === userId);
        if (!intent) {
          if (!existing) return {};
          if (existing.saved) { existing.intent = 'interested'; return { opportunityIntents: [existing] }; }
          db.opportunityIntents = db.opportunityIntents.filter((i) => i.id !== existing.id);
          return { removed: { opportunityIntents: [existing.id] } };
        }
        if (existing) { existing.intent = intent; return { opportunityIntents: [existing] }; }
        const rec = { id: uid('oi'), opportunityId, userId, intent, saved: false, createdAt: new Date().toISOString() };
        db.opportunityIntents.push(rec);
        return { opportunityIntents: [rec] };
      });
    },
    async toggleSave(opportunityId, userId) {
      return request(() => {
        const existing = db.opportunityIntents.find((i) => i.opportunityId === opportunityId && i.userId === userId);
        if (existing) {
          existing.saved = !existing.saved;
          return { opportunityIntents: [existing] };
        }
        const rec = { id: uid('oi'), opportunityId, userId, intent: 'interested' as const, saved: true, createdAt: new Date().toISOString() };
        db.opportunityIntents.push(rec);
        return { opportunityIntents: [rec] };
      });
    },
    async ask(opportunityId, authorId, text) {
      return request(() => { const o = find(db.opportunities, opportunityId); o.qna.push({ id: uid('c'), authorId, text, createdAt: new Date().toISOString() }); return { opportunities: [o] }; });
    },
    async review(opportunityId, authorId, text, result) {
      return request(() => { const o = find(db.opportunities, opportunityId); o.reviews.unshift({ id: uid('r'), authorId, text, result, createdAt: new Date().toISOString() }); return { opportunities: [o] }; });
    },
  },

  proposals: {
    async create(fromId, toId, input) {
      return request(() => {
        const p: ActivityProposal = {
          id: uid('pr'), fromId, toId, status: 'pending', createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 48 * 3600000).toISOString(), ...input,
        };
        db.proposals.push(p);
        if (AUTO_ACCEPT_PROPOSAL.has(toId)) {
          setTimeout(() => {
            if (p.status !== 'pending') return;
            p.status = 'accepted';
            const room = ensureDirectRoom(fromId, toId);
            const other = find(db.users, toId);
            room.messages.push({ id: uid('m'), senderId: toId, text: `${CATEGORY_LABELS[p.category]}${t(' 제안 좋아요! ')}${p.when}${t('에 봐요 :)')}`, createdAt: new Date().toISOString() });
            const nt = notify(fromId, { type: 'proposal_result', title: t('활동 제안이 수락되었어요'), body: `${other.nickname}${t('님이 제안을 수락했어요. 대화를 시작해보세요.')}`, link: `/chats/${room.id}` });
            push({ proposals: [p], chatRooms: [room], notifications: [nt] });
          }, 5000);
        }
        return { proposals: [p] };
      });
    },
    async respond(id, accept) {
      return request(() => {
        const p = find(db.proposals, id);
        p.status = accept ? 'accepted' : 'declined';
        if (!accept) return { proposals: [p] }; // 거절 사유·알림 없음
        const room = ensureDirectRoom(p.fromId, p.toId);
        room.messages.push({ id: uid('m'), senderId: p.toId, text: t('활동 제안을 수락했어요. 세부 일정 이야기해요!'), createdAt: new Date().toISOString(), system: true });
        return { proposals: [p], chatRooms: [room] };
      });
    },
  },

  together: {
    async create(hostId, input) {
      return request(() => {
        const host = find(db.users, hostId);
        const poll: TimePoll = {
          id: uid('tp'), hostId, title: input.title, category: input.category, place: input.place, inviteeIds: input.inviteeIds,
          options: input.options.map((o) => ({ ...o, id: uid('to') })), votes: {}, status: 'open', closesAt: input.closesAt, createdAt: new Date().toISOString(),
        };
        // 주최자는 모든 옵션에 가능한 것으로 시작
        poll.votes[hostId] = poll.options.map((o) => o.id);
        db.timePolls.unshift(poll);
        const nts: Notification[] = [];
        input.inviteeIds.forEach((uid2) => { if (uid2 === DEMO_USER_ID) nts.push(notify(DEMO_USER_ID, { type: 'plan_vote', title: t('언제 만날지 골라주세요'), body: `${host.nickname}${t('님이 "')}${poll.title}${t('" 시간을 정하고 있어요.')}`, link: `/together/${poll.id}` })); });
        // 데모: 초대받은 사람은 잠시 후 자기 시간표의 공강과 겹치는 시간에 자동 투표
        input.inviteeIds.filter((u) => u !== DEMO_USER_ID).forEach((uid2, i) => {
          setTimeout(() => {
            if (poll.status !== 'open') return;
            const u = db.users.find((x) => x.id === uid2); if (!u) return;
            const ok = poll.options.filter((o) => {
              if (!u.timetable.length) return Math.random() < 0.6;
              const day = jsDayToIdx(new Date(o.date).getDay());
              return freeBlocks(u.timetable, day).some((b) => b.start <= toMin(o.startTime) && b.end >= toMin(o.endTime));
            }).map((o) => o.id);
            poll.votes[uid2] = ok.length ? ok : [poll.options[0].id];
            push({ timePolls: [poll] });
          }, 3500 + i * 1800);
        });
        return { poll, patch: { timePolls: [poll], notifications: nts } };
      });
    },
    async vote(pollId, userId, optionIds) {
      return request(() => { const p = find(db.timePolls, pollId); p.votes[userId] = optionIds; return { timePolls: [p] }; });
    },
    async addOption(pollId, userId, option) {
      return request(() => {
        const p = find(db.timePolls, pollId);
        const o = { ...option, id: uid('to') };
        p.options.push(o);
        p.votes[userId] = [...new Set([...(p.votes[userId] ?? []), o.id])];
        return { timePolls: [p] };
      });
    },
    async decide(pollId, optionId) {
      return request(() => {
        const p = find(db.timePolls, pollId);
        const opt = p.options.find((o) => o.id === optionId);
        if (!opt) throw new Error(t('항목을 찾을 수 없어요.'));
        const goers = [...new Set([p.hostId, ...Object.entries(p.votes).filter(([, ids]) => ids.includes(optionId)).map(([u]) => u)])];
        const host = find(db.users, p.hostId);
        const activity: Activity = {
          id: uid('a'), kind: 'group', category: p.category, title: p.title, description: `${t('Plan Together로 정한 약속이에요. ')}${goers.length}${t('명이 이 시간에 가능하다고 했어요.')}`,
          cover: { emoji: { coffee: '☕', meal: '🍽️', study: '📖', exercise: '🏃', club: '🎸', performance: '🎤', school_event: '🎓', seminar: '🧪', networking: '🤝', store_deal: '🏷️', etc: '✨' }[p.category], hue: 200 },
          hostId: p.hostId, hostType: 'user', date: opt.date, startTime: opt.startTime, endTime: opt.endTime,
          place: p.place ?? { name: t('장소 미정'), lat: 0, lng: 0 }, capacity: Math.max(goers.length, p.inviteeIds.length + 1), visibility: 'selected', visibilityTargets: [...p.inviteeIds],
          joinPolicy: 'invite', fee: 0, invitedIds: [...p.inviteeIds], comments: [], createdAt: new Date().toISOString(),
        };
        db.activities.unshift(activity);
        const room = ensureActivityRoom(activity);
        const parts: Participation[] = goers.filter((g) => g !== p.hostId).map((userId) => {
          const pt: Participation = { id: uid('p'), activityId: activity.id, userId, status: 'approved', createdAt: new Date().toISOString() };
          db.participations.push(pt); addToRoom(room, userId); return pt;
        });
        p.status = 'decided'; p.decidedOptionId = optionId; p.activityId = activity.id;
        const nts: Notification[] = [];
        if (goers.includes(DEMO_USER_ID) && p.hostId !== DEMO_USER_ID) nts.push(notify(DEMO_USER_ID, { type: 'plan_decided', title: t('약속 시간이 정해졌어요'), body: `${host.nickname}${t('님이 "')}${p.title}${t('" 시간을 확정했어요. 그룹 채팅방이 열렸어요.')}`, link: `/activities/${activity.id}` }));
        return { activity, patch: { timePolls: [p], activities: [activity], participations: parts, chatRooms: [room], notifications: nts } };
      });
    },
    async cancel(pollId) {
      return request(() => { const p = find(db.timePolls, pollId); p.status = 'cancelled'; return { timePolls: [p] }; });
    },
  },

  chats: {
    async send(roomId, senderId, text) {
      return request(() => {
        const room = find(db.chatRooms, roomId);
        room.messages.push({ id: uid('m'), senderId, text, createdAt: new Date().toISOString() });
        room.lastReadAt[senderId] = new Date().toISOString();
        // 데모: 1:1 채팅에서 상대가 잠시 후 답장
        if (room.type === 'direct') {
          const other = room.memberIds.find((m) => m !== senderId);
          if (other) setTimeout(() => {
            room.messages.push({ id: uid('m'), senderId: other, text: REPLIES[Math.floor(Math.random() * REPLIES.length)], createdAt: new Date().toISOString() });
            push({ chatRooms: [room] });
          }, 2000 + Math.random() * 1500);
        }
        return { chatRooms: [room] };
      });
    },
    async markRead(roomId, userId) {
      const room = find(db.chatRooms, roomId);
      room.lastReadAt[userId] = new Date().toISOString();
      saveDB(db);
      return { chatRooms: [room] };
    },
    async openDirect(a, b) {
      return request(() => {
        const { version: _v, seededOn: _s, ...snapshot } = db;
        const check = canMessage(snapshot, a, b);
        if (!check.ok) throw new Error(check.reason);
        const room = ensureDirectRoom(a, b);
        return { room, patch: { chatRooms: [room] } };
      });
    },
  },

  notifications: {
    async markRead(id) {
      const n = find(db.notifications, id); n.read = true; saveDB(db); return { notifications: [n] };
    },
    async markAllRead(userId) {
      const mine = db.notifications.filter((n) => n.userId === userId);
      mine.forEach((n) => { n.read = true; });
      saveDB(db);
      return { notifications: mine };
    },
  },

  reports: {
    async create(reporterId, targetType, targetId, reason) {
      return request(() => {
        const r = { id: uid('rp'), reporterId, targetType, targetId, reason, createdAt: new Date().toISOString() };
        db.reports.push(r);
        return { reports: [r] };
      });
    },
  },

  system: {
    async reset() { db = resetDB(); },
    failNext() { failNextRequest = true; },
  },

  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
