import React, { useState, useCallback, useEffect } from 'react';
import { Smile, Loader2 } from 'lucide-react';
import { useNDK } from '@/hooks/useNDK';
import { useNotification } from '@/context/NotificationContext';
import { usePopups } from '@/context/PopupContext';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { log } from '@/lib/debug';
import type { EmojiClickData } from 'emoji-picker-react';

interface EmojiReactionsProps {
  reviewId?: string;
  mintId: string;
  mintUrl: string;
  pubkey: string;
}

interface Reaction {
  emoji: string;
  count: number;
  reacted: boolean;
  eventId?: string;
  animating?: boolean;
}

const EmojiReactions: React.FC<EmojiReactionsProps> = ({ 
  reviewId, 
  mintId, 
  mintUrl, 
  pubkey 
}) => {
  const { ndk, publicKey } = useNDK();
  const { showNotification } = useNotification();
  const { showEmojiPicker } = usePopups();
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingEmoji, setProcessingEmoji] = useState<string | null>(null);

  const handleEmojiSelect = async (emojiData: EmojiClickData) => {
    const existingReaction = reactions.find(r => r.emoji === emojiData.emoji);
    await handleReaction(emojiData.emoji, existingReaction);
  };

  const handleReaction = async (emoji: string, existingReaction?: Reaction) => {
    if (!ndk || !publicKey) {
      showNotification('Please login to react', 'error');
      return;
    }

    try {
      setProcessingEmoji(emoji);

      if (existingReaction?.reacted) {
        const deleteEvent = new NDKEvent(ndk);
        deleteEvent.kind = 5;
        deleteEvent.content = '';
        deleteEvent.tags = [
          ['e', existingReaction.eventId!],
          ['k', '7']
        ];

        await deleteEvent.sign();
        await deleteEvent.publish();

        log.nostr('Reaction removed:', { emoji, eventId: existingReaction.eventId });

        setReactions(current => 
          current.map(r => 
            r.emoji === emoji 
              ? { ...r, count: r.count - 1, reacted: false, eventId: undefined }
              : r
          ).filter(r => r.count > 0)
        );
      } else {
        const reactionEvent = new NDKEvent(ndk);
        reactionEvent.kind = 7;
        reactionEvent.content = emoji;
        reactionEvent.tags = [
          ...(reviewId ? [['e', reviewId]] : []),
          ['a', `38172:${mintId}`],
          ['k', reviewId ? '38000' : '38172'],
          ['r', mintUrl],
          ['p', pubkey]
        ];

        await reactionEvent.sign();
        await reactionEvent.publish();
        
        log.nostr('Reaction added:', { 
          emoji, 
          reviewId, 
          mintId, 
          eventId: reactionEvent.id 
        });

        setReactions(current => {
          const existing = current.find(r => r.emoji === emoji);
          if (existing) {
            return current.map(r => 
              r.emoji === emoji 
                ? { ...r, count: r.count + 1, reacted: true, eventId: reactionEvent.id, animating: true }
                : r
            );
          }
          return [...current, { 
            emoji, 
            count: 1, 
            reacted: true, 
            eventId: reactionEvent.id,
            animating: true 
          }];
        });

        setTimeout(() => {
          setReactions(current => 
            current.map(r => 
              r.emoji === emoji ? { ...r, animating: false } : r
            )
          );
        }, 1000);
      }

      showNotification(
        existingReaction?.reacted ? 'Reaction removed' : 'Reaction added', 
        'success'
      );
    } catch (error) {
      console.error('Error handling reaction:', error);
      showNotification('Failed to update reaction', 'error');
    } finally {
      setProcessingEmoji(null);
    }
  };

  useEffect(() => {
    const fetchReactions = async () => {
      if (!ndk) return;

      try {
        setLoading(true);
        const filter = {
          kinds: [7],
          '#e': reviewId ? [reviewId] : [],
          '#a': [`38172:${mintId}`],
          limit: 100
        };

        const events = await ndk.fetchEvents(filter);
        const reactionMap = new Map<string, Reaction>();

        events.forEach(event => {
          const emoji = event.content || '👍';
          const existing = reactionMap.get(emoji) || { 
            emoji, 
            count: 0, 
            reacted: event.pubkey === publicKey,
            eventId: event.pubkey === publicKey ? event.id : undefined
          };
          
          existing.count++;
          reactionMap.set(emoji, existing);
        });

        setReactions(Array.from(reactionMap.values()));
      } catch (error) {
        console.error('Error fetching reactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReactions();

    if (ndk) {
      const filter = {
        kinds: [7, 5],
        '#e': reviewId ? [reviewId] : [],
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
          onEvent: (event) => {
            if (event.kind === 5) {
              const deletedId = event.tags.find(t => t[0] === 'e')?.[1];
              if (deletedId) {
                setReactions(current => 
                  current.filter(r => r.eventId !== deletedId)
                );
              }
            } else {
              fetchReactions();
            }
          }
        }
      );

      return () => {
        subscription.stop();
      };
    }
  }, [ndk, mintId, reviewId, publicKey]);

  if (loading) {
    return <div className="animate-pulse h-8 bg-gray-700/50 rounded-lg w-32" />;
  }

  return (
    <div className="relative">
      <div className="flex items-center space-x-2">
        {reactions.map((reaction) => (
          <button
            key={reaction.emoji}
            onClick={() => handleReaction(reaction.emoji, reaction)}
            disabled={processingEmoji === reaction.emoji}
            className={`px-2 py-1 rounded-lg text-sm ${
              reaction.reacted 
                ? 'bg-[#f5a623] text-black' 
                : 'bg-gray-700 hover:bg-gray-600'
            } transition-all duration-300 ${
              reaction.animating ? 'animate-pop' : ''
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {processingEmoji === reaction.emoji ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>{reaction.emoji}</span>
                <span className="ml-1">{reaction.count}</span>
              </>
            )}
          </button>
        ))}
        {publicKey ? (
          <button
            onClick={() => showEmojiPicker(handleEmojiSelect)}
            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            <Smile className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => showNotification('Please login to react', 'error')}
            className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors"
          >
            <Smile className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default EmojiReactions;