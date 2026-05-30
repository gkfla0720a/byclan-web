// 파일명: src/hooks/usePostDetail.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/supabase';
import { useAuthContext } from '@/context/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { hasPermission, normalizeRole, isInGroup } from '@/utils/permissions';
import type { Database } from '@/types';

type PostsRow = Database['public']['Tables']['posts']['Row'];
type CommentsRow = Database['public']['Tables']['comments']['Row'];

export interface JoinedPost extends PostsRow {
  profiles: { by_id: string | null } | null;
}

export interface JoinedComment extends CommentsRow {
  profiles: { by_id: string | null } | null;
}

export function usePostDetail() {
  const { user, profile } = useAuthContext();
  const params = useParams();
  const router = useRouter();
  const postId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<JoinedPost | null>(null);
  const [commentsList, setCommentsList] = useState<JoinedComment[]>([]);

  const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(null);
  const [voteCounts, setVoteCounts] = useState({ like: 0, dislike: 0 });

  const [comment, setComment] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [adjacentPosts, setAdjacentPosts] = useState<{ prev: number | null; next: number | null }>({ prev: null, next: null });

  const activeRole = normalizeRole((profile?.role as string) || null);
  const isManager = hasPermission(activeRole, 'clan.admin') || isInGroup(activeRole, 'management');

  const isAuthor = Boolean(user?.id && post?.user_id && user.id === post.user_id);

  const fetchComments = useCallback(async () => {
    if (!postId || isNaN(postId)) return;
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles!user_id(by_id)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    if (!error && data) setCommentsList(data as unknown as JoinedComment[]);
  }, [postId]);

  const fetchVoteCounts = useCallback(async () => {
    if (!postId || isNaN(postId)) return;
    const { data, error } = await supabase.from('post_votes').select('vote_type').eq('post_id', postId);
    if (!error && data) {
      setVoteCounts({
        like: data.filter(v => v.vote_type === 'like').length,
        dislike: data.filter(v => v.vote_type === 'dislike').length
      });
    }
  }, [postId]);

  const fetchUserVote = useCallback(async () => {
    if (!user?.id || !postId || isNaN(postId)) return;
    const { data } = await supabase.from('post_votes').select('vote_type').eq('post_id', postId).eq('user_id', user.id).maybeSingle();
    setUserVote(data?.vote_type === 'like' || data?.vote_type === 'dislike' ? data.vote_type : null);
  }, [postId, user?.id]);

  useEffect(() => {
    if (!postId || isNaN(postId)) return;

    const fetchAllData = async () => {
      setLoading(true);
      try {
        const { data: postData, error } = await supabase.from('posts').select('*, profiles!user_id(by_id)').eq('id', postId).single();
        if (error) throw error;

        if (postData) {
          const prof = Array.isArray(postData.profiles) ? postData.profiles[0] : postData.profiles;
          setPost({ ...postData, profiles: prof } as JoinedPost);

          await supabase.rpc('increment_views', { row_id: postId });

          const [{ data: nextD }, { data: prevD }] = await Promise.all([
            supabase.from('posts').select('id').lt('created_at', postData.created_at).order('created_at', { ascending: false }).limit(1).maybeSingle(),
            supabase.from('posts').select('id').gt('created_at', postData.created_at).order('created_at', { ascending: true }).limit(1).maybeSingle()
          ]);
          setAdjacentPosts({ prev: prevD?.id ?? null, next: nextD?.id ?? null });
        }
        await Promise.all([fetchComments(), fetchVoteCounts(), fetchUserVote()]);
      } catch (err) {
        console.error("게시글 로딩 실패:", err);
      } finally {
        setLoading(false);
      }
    };
    queueMicrotask(() => { fetchAllData(); });
  }, [postId, fetchComments, fetchVoteCounts, fetchUserVote]);

  const handleCommentSubmit = async () => {
    if (!comment.trim()) return;
    if (!user) return alert('로그인한 클랜원만 작성 가능합니다!');

    const { error } = await supabase.from('comments').insert([{ post_id: postId, user_id: user.id, content: comment }]);
    if (!error) {
      setComment('');
      fetchComments();
    } else {
      alert('댓글 작성 실패: ' + error.message);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (!error) fetchComments();
  };

  const handleUpdateComment = async (commentId: number) => {
    if (!editContent.trim()) return;
    const { error } = await supabase.from('comments').update({ content: editContent }).eq('id', commentId);
    if (!error) {
      setEditingCommentId(null);
      fetchComments();
    }
  };

  const handleVote = async (type: 'like' | 'dislike') => {
    if (!user) return alert('로그인한 클랜원만 투표가 가능합니다!');
    try {
      if (userVote === type) {
        setUserVote(null);
        setVoteCounts(prev => ({ ...prev, [type]: Math.max(0, prev[type] - 1) }));
        await supabase.from('post_votes').delete().eq('post_id', postId).eq('user_id', user.id);
      } else {
        setUserVote(type);
        setVoteCounts(prev => ({
          like: type === 'like' ? prev.like + 1 : (userVote === 'like' ? Math.max(0, prev.like - 1) : prev.like),
          dislike: type === 'dislike' ? prev.dislike + 1 : (userVote === 'dislike' ? Math.max(0, prev.dislike - 1) : prev.dislike)
        }));
        await supabase.from('post_votes').upsert({ post_id: postId, user_id: user.id, vote_type: type }, { onConflict: 'post_id, user_id' });
      }
    } catch (err) {
      fetchVoteCounts();
      fetchUserVote();
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('정말로 삭제하시겠습니까?')) return;
    await supabase.from('posts').delete().eq('id', postId);
    router.push('/community');
  };

  return {
    post, commentsList, loading, user, isAuthor, isManager, router, adjacentPosts,
    userVote, voteCounts, handleVote, handleDeletePost,
    comment, setComment, handleCommentSubmit,
    editingCommentId, setEditingCommentId, editContent, setEditContent,
    handleUpdateComment, handleDeleteComment
  };
}