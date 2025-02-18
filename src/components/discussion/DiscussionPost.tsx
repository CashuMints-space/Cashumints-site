import React, { useState } from 'react';
import { Send, Loader2, MessageSquare } from 'lucide-react';
import { useNDK } from '../../hooks/useNDK';
import { useNotification } from '../../context/NotificationContext';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { log } from '../../lib/debug';

interface DiscussionPostProps {
  mintId: string;
  mintUrl: string;
  onPostSuccess: (event: NDKEvent) => void;
}

const DiscussionPost: React.FC<DiscussionPostProps> = ({ 
  mintId, 
  mintUrl,
  onPostSuccess 
}) => {
  const { ndk, publicKey } = useNDK();
  const { showNotification } = useNotification();
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ndk || !publicKey) {
      showNotification('Please login to comment', 'error');
      return;
    }

    if (!newComment.trim()) {
      showNotification('Please enter a comment', 'error');
      return;
    }

    try {
      setSubmitting(true);
      
      const event = new NDKEvent(ndk);
      event.kind = 1;
      event.content = newComment.trim();
      event.tags = [
        ['a', `38172:${mintId}`],
        ['r', mintUrl]
      ];

      await event.sign();

      // Publish to multiple relays
      const relays = Array.from(ndk.pool?.relays.values() || []);
      const publishPromises = relays.map(relay => 
        relay.publish(event)
          .then(() => log.nostr(`Published to ${relay.url}`))
          .catch(err => console.warn(`Failed to publish to ${relay.url}:`, err))
      );

      // Wait for at least one successful publish
      await Promise.any(publishPromises);
      
      log.nostr('Comment published:', { mintId, content: newComment });
      
      setNewComment('');
      showNotification('Comment published successfully', 'success');
      onPostSuccess(event);
    } catch (error) {
      console.error('Error publishing comment:', error);
      showNotification('Failed to publish comment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!publicKey) {
    return (
      <div className="bg-gray-700 rounded-lg p-4 text-center">
        <p className="text-gray-400 mb-2">Login to join the discussion</p>
        <button
          onClick={() => showNotification('Please login to comment', 'error')}
          className="inline-flex items-center space-x-2 bg-[#f5a623] text-black px-4 py-2 rounded-lg hover:bg-[#d48c1c] transition-colors"
        >
          <MessageSquare className="h-4 w-4" />
          <span>Login to Comment</span>
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        placeholder="Add to the discussion..."
        className="w-full bg-gray-700 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#f5a623] min-h-[100px]"
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting || !newComment.trim()}
          className="inline-flex items-center space-x-2 bg-[#f5a623] text-black px-4 py-2 rounded-lg hover:bg-[#d48c1c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>Post</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default DiscussionPost;