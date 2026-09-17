import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PenSquare } from 'lucide-react';
import { TopBar } from '@/components/layout/TopBar';
import { Chip, ChipRow, Button, CardSkeleton, EmptyState, ErrorState } from '@/components/ui';
import { PostCard } from '@/components/cards/PostCard';
import { OrgCard } from '@/components/cards/OrgCard';
import { useViewer } from '@/hooks/useViewer';
import { useAppStore } from '@/store/useAppStore';
import { friendsOf } from '@/lib/relations';

const CATS = [{ key: 'recommend', label: '추천' }, { key: 'friends', label: '친구' }, { key: 'school', label: '내 학교' }, { key: 'club', label: '동아리' }, { key: 'public', label: '전체 공개' }] as const;
type Cat = typeof CATS[number]['key'];

export function CommunityPage() {
  const nav = useNavigate();
  const status = useAppStore((s) => s.status);
  const error = useAppStore((s) => s.error);
  const init = useAppStore((s) => s.init);
  const orgs = useAppStore((s) => s.organizations);
  const v = useViewer();
  const [cat, setCat] = useState<Cat>('recommend');
  const me = v.me;
  const friendIds = useMemo(() => new Set(friendsOf(v.snap, me.id)), [v.snap, me.id]);
  const mySchool = me.affiliation.type === 'university' ? me.affiliation.schoolId : '';

  const posts = useMemo(() => v.visiblePosts.filter((p) => {
    const author = v.userById(p.authorId);
    const sid = author?.affiliation.type === 'university' ? author.affiliation.schoolId : '';
    switch (cat) {
      case 'friends': return friendIds.has(p.authorId);
      case 'school': return sid === mySchool;
      case 'club': return p.authorType === 'org';
      case 'public': return p.visibility === 'public';
      default: return true;
    }
  }).sort((a, b) => (cat === 'recommend' ? (b.likeIds.length + b.comments.length * 2) - (a.likeIds.length + a.comments.length * 2) : b.createdAt.localeCompare(a.createdAt))), [v, cat, friendIds, mySchool]);

  const clubs = orgs.filter((o) => o.schoolId === mySchool);

  return (
    <div className="min-h-full pb-6">
      <TopBar title="커뮤니티" bell messages right={<Button size="sm" variant="ghost" icon={<PenSquare size={16} />} onClick={() => nav('/create/post')}>글쓰기</Button>} />
      <div className="px-4 pt-2"><ChipRow className="py-0">{CATS.map((c) => <Chip key={c.key} active={cat === c.key} onClick={() => setCat(c.key)}>{c.label}</Chip>)}</ChipRow></div>
      {status === 'loading' && <CardSkeleton />}
      {status === 'error' && <ErrorState message={error ?? undefined} onRetry={init} />}
      {status === 'ready' && (
        <div className="px-4 pt-4 space-y-4">
          {cat === 'club' && clubs.length > 0 && (
            <div className="space-y-2"><h2 className="text-[15px] font-bold">내 학교 동아리·조직</h2>{clubs.map((o) => <OrgCard key={o.id} org={o} />)}</div>
          )}
          {posts.length === 0 ? (
            <EmptyState emoji="📝" title="아직 게시물이 없어요" description={cat === 'friends' ? '친구를 추가하면 친구의 게시물이 여기에 보여요.' : '첫 게시물을 올려보세요.'} action={<Button icon={<PenSquare size={16} />} onClick={() => nav('/create/post')}>게시물 작성</Button>} />
          ) : posts.map((p) => <PostCard key={p.id} post={p} />)}
        </div>
      )}
    </div>
  );
}
