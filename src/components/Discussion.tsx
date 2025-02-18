import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, User, Calendar, Reply, Edit, Trash2, Save, Loader2 } from 'lucide-react';
import { useNDK } from '../hooks/useNDK';
import { useNotification } from '../context/NotificationContext';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { log } from '../lib/debug';
import ZapButton from './ZapButton';
import EmojiReactions from './EmojiReactions';
import DiscussionPost from './discussion/DiscussionPost';
import DiscussionReply from './discussion/DiscussionReply';
import type { Comment } from './discussion/types';

interface DiscussionProps {
  mintId: string;
  mintUrl: string;
}

const Discussion: React.FC<DiscussionProps> = ({ mintId, mintUrl }) => {
  const { ndk, publicKey } = useNDK();
  const { showNotification } = useNotification();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const addNewComment = useCallback(async (event: NDKEvent) => {
    if (!ndk) return;

    try {
      const user = await ndk.getUser({ pubkey: event.pubkey });
      const profile = await user.fetchProfile();
      const replyTo = event.tags.find(t => t[0] === 'e')?.[1];
      
      const newComment = {
        id: event.id,
        pubkey: event.pubkey,
        content: event.content,
        createdAt: event.created_at,
        replyTo,
        profile
      };

      setComments(current => {
        // Check if comment already exists
        if (current.some(c => c.id === newComment.id)) {
          return current;
        }

        // Add new comment and sort
        const updatedComments = [newComment, ...current];
        return updatedComments.sort((a, b) => {
          // If one is a reply and the other isn't, non-replies come first
          if (!a.replyTo && b.replyTo) return -1;
          if (a.replyTo && !b.replyTo) return 1;
          // If both are replies or both are not, sort by date
          return b.createdAt - a.createdAt;
        });
      });
    } catch (error) {
      console.error('Error processing new comment:', error);
    }
  }, [ndk]);

  const fetchComments = useCallback(async () => {
    if (!ndk) return;

    try {
      setLoading(true);
      const filter = {
        kinds: [1],
        '#a': [`38172:${mintId}`],
        limit: 100
      };

      const events = await ndk.fetchEvents(filter);
      const processedComments = await Promise.all(
        Array.from(events).map(async event => {
          const user = await ndk.getUser({ pubkey: event.pubkey });
          const profile = await user.fetchProfile();
          const replyTo = event.tags.find(t => t[0] === 'e')?.[1];
          
          return {
            id: event.id,
            pubkey: event.pubkey,
            content: event.content,
            createdAt: event.created_at,
            replyTo,
            profile
          };
        })
      );

      // Sort comments: top-level first, then by date
      const sortedComments = processedComments.sort((a, b) => {
        if (!a.replyTo && b.replyTo) return -1;
        if (a.replyTo && !b.replyTo) return 1;
        return b.createdAt - a.createdAt;
      });

      setComments(sortedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      showNotification('Failed to load comments', 'error');
    } finally {
      setLoading(false);
    }
  }, [ndk, mintId, showNotification]);

  useEffect(() => {
    fetchComments();

    if (ndk) {
      const filter = {
        kinds: [1, 5],
        '#a': [`38172:${mintId}`],
        since: Math.floor(Date.now() / 1000)
      };

      const subscription = ndk.subscribe(
        [filter],
        {
          closeOnEose: false,
          groupable: true,
          groupingDelay: 200
        },
        undefined,
        {
          onEvent: async (event) => {
            if (event.kind === 5) {
              // Handle deletion
              const deletedId = event.tags.find(t => t[0] === 'e')?.[1];
              if (deletedId) {
                setComments(current => current.filter(c => c.id !== deletedId));
              }
            } else {
              // Handle new comment
              await addNewComment(event);
            }
          }
        }
      );

      return () => {
        subscription.stop();
      };
    }
  }, [ndk, mintId, fetchComments, addNewComment]);

  const handleEditComment = async (commentId: string) => {
    if (!ndk || !publicKey) return;

    try {
      // Create deletion event for old comment
      const deleteEvent = new NDKEvent(ndk);
      deleteEvent.kind = 5;
      deleteEvent.content = '';
      deleteEvent.tags = [['e', commentId]];

      await deleteEvent.sign();
      
      // Optimistically update UI
      const originalComment = comments.find(c => c.id === commentId);
      setComments(current => current.filter(c => c.id !== commentId));

      // Create new comment
      const event = new NDKEvent(ndk);
      event.kind = 1;
      event.content = editContent;
      event.tags = [
        ['a', `38172:${mintId}`],
        ['r', mintUrl]
      ];

      if (originalComment?.replyTo) {
        event.tags.push(['e', originalComment.replyTo]);
        const parentComment = comments.find(c => c.id === originalComment.replyTo);
        if (parentComment) {
          event.tags.push(['p', parentComment.pubkey]);
        }
      }

      await event.sign();

      // Publish events to multiple relays
      const relays = Array.from(ndk.pool?.relays.values() || []);
      
      // Publish delete event
      const deletePromises = relays.map(relay =>
        relay.publish(deleteEvent)
          .then(() => log.nostr(`Delete event published to ${relay.url}`))
          .catch(err => console.warn(`Failed to publish delete to ${relay.url}:`, err))
      );

      // Publish new event
      const publishPromises = relays.map(relay =>
        relay.publish(event)
          .then(() => log.nostr(`Edit published to ${relay.url}`))
          .catch(err => console.warn(`Failed to publish edit to ${relay.url}:`, err))
      );

      // Wait for at least one successful publish of each event
      await Promise.all([
        Promise.any(deletePromises),
        Promise.any(publishPromises)
      ]);

      setEditingComment(null);
      setEditContent('');
      showNotification('Comment updated successfully', 'success');
    } catch (error) {
      console.error('Error updating comment:', error);
      showNotification('Failed to update comment', 'error');
      // Revert changes if publishing failed
      fetchComments();
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!ndk || !publicKey) return;

    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      const event = new NDKEvent(ndk);
      event.kind = 5;
      event.content = '';
      event.tags = [['e', commentId]];

      await event.sign();
      
      // Optimistically remove comment
      setComments(current => current.filter(c => c.id !== commentId));

      // Publish to multiple relays
      const relays = Array.from(ndk.pool?.relays.values() || []);
      const publishPromises = relays.map(relay =>
        relay.publish(event)
          .then(() => log.nostr(`Delete published to ${relay.url}`))
          .catch(err => console.warn(`Failed to publish delete to ${relay.url}:`, err))
      );

      // Wait for at least one successful publish
      await Promise.any(publishPromises);
      
      showNotification('Comment deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting comment:', error);
      showNotification('Failed to delete comment', 'error');
      // Revert changes if publishing failed
      fetchComments();
    }
  };

  const renderComment = (comment: Comment, isReply = false) => {
    const isUserComment = publicKey && comment.pubkey === publicKey;
    const replies = comments.filter(c => c.replyTo === comment.id);

    return (
      <div key={comment.id} className={`${isReply ? 'ml-8 mt-4' : 'mb-4'}`}>
        <div className="bg-gray-700/50 backdrop-blur rounded-xl p-4">
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              {comment.profile?.image ? (
                <img 
                  src={comment.profile.image} 
                  alt={comment.profile.name || 'User'} 
                  className="w-10 h-10 rounded-full"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${comment.pubkey}`;
                  }}
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
              )}
            </div>
            <div className="flex-grow min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">
                  {comment.profile?.name || comment.profile?.displayName || 'Anonymous'}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">
                    {new Date(comment.createdAt * 1000).toLocaleDateString()}
                  </span>
                  <ZapButton pubkey={comment.pubkey} eventId={comment.id} small />
                </div>
              </div>

              {editingComment === comment.id ? (
                <div className="space-y-3">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full bg-gray-600 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f5a623]"
                    rows={3}
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setEditingComment(null)}
                      className="px-3 py-1 text-sm rounded-lg bg-gray-600 hover:bg-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleEditComment(comment.id)}
                      className="flex items-center space-x-1 px-3 py-1 text-sm rounded-lg bg-[#f5a623] text-black hover:bg-[#d48c1c] transition-colors"
                    >
                      <Save className="h-4 w-4" />
                      <span>Save</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-gray-300 break-words whitespace-pre-wrap mb-3">
                    {comment.content}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => setReplyingTo(comment.id)}
                        className="flex items-center space-x-1 text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        <Reply className="h-4 w-4" />
                        <span>Reply</span>
                      </button>
                      <EmojiReactions
                        mintId={mintId}
                        mintUrl={mintUrl}
                        pubkey={comment.pubkey}
                        reviewId={comment.id}
                      />
                    </div>
                    {isUserComment && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setEditingComment(comment.id);
                            setEditContent(comment.content);
                          }}
                          className="p-1 text-gray-400 hover:text-white transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Reply Form */}
        {replyingTo === comment.id && (
          <div className="ml-8 mt-4">
            <DiscussionReply
              mintId={mintId}
              mintUrl={mintUrl}
              parentComment={comment}
              onReplySuccess={(event) => {
                addNewComment(event);
                setReplyingTo(null);
              }}
              onCancel={() => setReplyingTo(null)}
            />
          </div>
        )}

        {/* Render Replies */}
        {replies.map(reply => renderComment(reply, true))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center space-x-2">
        <MessageSquare className="h-5 w-5 text-[#f5a623]" />
        <span>Discussion</span>
      </h3>

      <DiscussionPost
        mintId={mintId}
        mintUrl={mintUrl}
        onPostSuccess={addNewComment}
      />

      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-[#f5a623]" />
          </div>
        ) : comments.length > 0 ? (
          comments.filter(c => !c.replyTo).map(comment => renderComment(comment))
        ) : (
          <div className="text-center py-8 bg-gray-700/50 backdrop-blur rounded-lg">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-500" />
            <p className="text-gray-400">No comments yet. Start the discussion!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Discussion;