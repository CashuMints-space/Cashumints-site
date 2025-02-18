import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { useNDK } from '../../hooks/useNDK';
import { useNotification } from '../../context/NotificationContext';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { log } from '../../lib/debug';
import type { Comment } from './types';

interface DiscussionReplyProps {
  mintId: string;
  mintUrl: string;
  parentComment: Comment;
  onReplySuccess: (event: NDKEvent) => void;
  onCancel: () => void;
}

const DiscussionReply: React.FC<DiscussionReplyProps> = ({
  mintId,
  mintUrl,
  parentComment,
  onReplySuccess,
  onCancel
}) => {
  const { ndk, publicKey } = useNDK();
  const { showNotification } = useNotification();
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ndk || !publicKey) {
      showNotification('Please login to reply', 'error');
      return;
    }

    if (!newComment.trim()) {
      showNotification('Please enter a reply', 'error');
      return;
    }

    try {
      setSubmitting(true);
      
      const event = new NDKEvent(ndk);
      event.kind = 1;
      event.content = newComment.trim();
      event.tags = [
        ['a', `38172:${mintId}`],
        ['r', mintUrl],
        ['e', parentComment.id],
        ['p', parentComment.pubkey]
      ];

      await event.sign();

      // Publish to multiple relays
      const relays = Array.from(ndk.pool?.relays.values() || []);
      const publishPromises = relays.map(relay => 
        relay.publish(event)
          .then(() => log.nostr(`Reply published to ${relay.url}`))
          .catch(err => console.warn(`Failed to publish reply to ${relay.url}:`, err))
      );

      // Wait for at least one successful publish
      await Promise.any(publishPromises);
      
      log.nostr('Reply published:', { 
        mintId, 
        content: newComment,
        parentId: parentComment.id 
      });
      
      setNewComment('');
      showNotification('Reply published successfully', 'success');
      onReplySuccess(event);
    } catch (error) {
      console.error('Error publishing reply:', error);
      showNotification('Failed to publish reply', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        placeholder="Write a reply..."
        className="w-full bg-gray-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#f5a623] min-h-[100px]"
      />
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting || !newComment.trim()}
          className="inline-flex items-center space-x-2 bg-[#f5a623] text-black px-4 py-2 rounded-lg hover:bg-[#d48c1c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>Reply</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default DiscussionReply;