import type { Snapshot } from '../types';
import * as seedKo from '@/data/seed';
import * as seedEn from '@/data/seed.en';
import { lang } from '@/i18n';

const seed = lang === 'en' ? seedEn : seedKo;

const STORAGE_KEY = `aroundu.mockdb.v4.${lang}`;
const SESSION_KEY = `aroundu.session.v1.${lang}`;

export interface MockDB extends Snapshot {
  version: number;
  seededOn: string;
}

function freshDB(): MockDB {
  return {
    version: 4,
    seededOn: new Date().toISOString().slice(0, 10),
    users: structuredClone(seed.users),
    schools: structuredClone(seed.schools),
    organizations: structuredClone(seed.organizations),
    activities: structuredClone(seed.activities),
    participations: structuredClone(seed.participations),
    posts: structuredClone(seed.posts),
    relationships: structuredClone(seed.relationships),
    proposals: structuredClone(seed.proposals),
    chatRooms: structuredClone(seed.chatRooms),
    notifications: structuredClone(seed.notifications),
    reports: [],
    opportunities: structuredClone(seed.opportunities),
    opportunityIntents: structuredClone(seed.opportunityIntents),
  };
}

export function loadDB(): MockDB {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MockDB;
      // 날짜가 바뀌면 '오늘' 기준 예시 데이터를 다시 만든다
      if (parsed.version === 4 && parsed.seededOn === new Date().toISOString().slice(0, 10)) return parsed;
    }
  } catch { /* ignore */ }
  const db = freshDB();
  saveDB(db);
  return db;
}

export function saveDB(db: MockDB) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); } catch { /* ignore quota */ }
}

export function resetDB(): MockDB {
  const db = freshDB();
  saveDB(db);
  return db;
}

export function getSession(): string | null {
  try { return localStorage.getItem(SESSION_KEY); } catch { return null; }
}
export function setSession(id: string | null) {
  try { id ? localStorage.setItem(SESSION_KEY, id) : localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
}
