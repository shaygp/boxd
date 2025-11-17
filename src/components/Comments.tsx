import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card } from './ui/card';
import { Heart, Trash2 } from 'lucide-react';
import { addComment, getComments, deleteComment, toggleCommentLike, Comment } from '@/services/comments';
import { auth } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';

interface CommentsProps {
  raceLogId: string;
}

export const Comments = ({ raceLogId }: CommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const loadComments = async () => {
    try {
      const data = await getComments(raceLogId);
      setComments(data);
    } catch (error: any) {
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [raceLogId]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      await addComment(raceLogId, newComment);
      setNewComment('');
      await loadComments();
      toast({ title: 'Comment added' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteComment(commentId, raceLogId);
      await loadComments();
      toast({ title: 'Comment deleted' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleLikeComment = async (commentId: string) => {
    try {
      await toggleCommentLike(commentId);
      await loadComments();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const currentUser = auth.currentUser;

  if (loading) {
    return <div className="text-center py-4 text-muted-foreground">Loading comments...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Comments</h3>

      {currentUser && (
        <div className="space-y-2">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
          />
          <Button
            onClick={handleAddComment}
            disabled={submitting || !newComment.trim()}
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No comments yet</p>
        ) : (
          comments.map((comment) => (
            <Card key={comment.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  {comment.userAvatar ? (
                    <img src={comment.userAvatar} alt={comment.username} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-sm font-semibold">{comment.username.charAt(0).toUpperCase()}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{comment.username}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-sm mb-2">{comment.content}</p>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 gap-1"
                      onClick={() => comment.id && handleLikeComment(comment.id)}
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          comment.likedBy?.includes(currentUser?.uid || '')
                            ? 'fill-racing-red text-racing-red'
                            : ''
                        }`}
                      />
                      <span className="text-xs">{comment.likesCount || 0}</span>
                    </Button>

                    {currentUser?.uid === comment.userId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0 text-destructive"
                        onClick={() => comment.id && handleDeleteComment(comment.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
