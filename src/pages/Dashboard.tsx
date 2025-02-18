import React, { useEffect, useState } from 'react';
import { useNDK } from '../hooks/useNDK';
import { useMints } from '../context/MintsContext';
import { useNotification } from '../context/NotificationContext';
import { useSettings } from '../hooks/useSettings';
import { 
  MessageSquare, 
  Settings, 
  Radio, 
  AlertCircle,
  Loader2,
  X,
  Star,
  Calendar,
  Edit,
  Trash2,
  Save,
  Link,
  Wallet
} from 'lucide-react';
import Footer from '../components/Footer';
import StarRating from '../components/StarRating';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { log, logError } from '../lib/debug';

const Dashboard = () => {
  const { publicKey, ndk } = useNDK();
  const { mints, refreshMints } = useMints();
  const { showNotification } = useNotification();
  const { settings, updateSettings, updateNWC } = useSettings();
  const [userReviews, setUserReviews] = useState<any[]>([]);
  const [showRelayManager, setShowRelayManager] = useState(false);
  const [customRelay, setCustomRelay] = useState('');
  const [relays, setRelays] = useState<string[]>([]);
  const [suggestedRelays, setSuggestedRelays] = useState<string[]>([]);
  const [loadingRelays, setLoadingRelays] = useState(false);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editRating, setEditRating] = useState(5);
  const [nwcInput, setNwcInput] = useState('');
  const [defaultZapAmount, setDefaultZapAmount] = useState(settings.defaultZapAmount.toString());

  useEffect(() => {
    const loadUserReviews = async () => {
      if (!ndk || !publicKey) return;

      try {
        setLoadingReviews(true);
        log.nostr('Fetching user reviews...');

        // Fetch all reviews by the user
        const filter: NDKFilter = {
          kinds: [38000],
          authors: [publicKey],
          "#k": ["38172"],
          limit: 100 // Increase limit to get more reviews
        };

        const events = await ndk.fetchEvents(filter);
        const reviews = await Promise.all(Array.from(events).map(async event => {
          const mintId = event.getMatchingTags('d')[0]?.[1];
          const mint = mints.find(m => m.id === mintId);
          const content = event.content;
          const ratingMatch = content.match(/^\[(\d+)\/5\]/);
          const rating = ratingMatch ? parseInt(ratingMatch[1], 10) : 0;
          const cleanContent = content.replace(/^\[(\d+)\/5\]\s*/, '');

          return {
            id: event.id,
            event,
            mintId,
            mintName: mint?.name || 'Unknown Mint',
            mintUrl: mint?.url || '',
            content: cleanContent || null, // Handle empty content case
            rating,
            createdAt: event.created_at
          };
        }));

        log.nostr('Fetched reviews:', reviews.length);
        setUserReviews(reviews.sort((a, b) => b.createdAt - a.createdAt));
      } catch (error) {
        logError(error, 'Loading user reviews');
        showNotification('Failed to load reviews', 'error');
      } finally {
        setLoadingReviews(false);
      }
    };

    loadUserReviews();
  }, [ndk, publicKey, mints]);

  const handleEditReview = (review: any) => {
    setEditingReview(review.id);
    setEditContent(review.content);
    setEditRating(review.rating);
  };

  const handleSaveEdit = async (review: any) => {
    if (!ndk) return;

    try {
      log.nostr('Updating review:', { id: review.id, content: editContent, rating: editRating });

      const event = {
        kind: 38000,
        content: `${editRating} stars - ${editContent}`,
        tags: [
          ['k', '38172'],
          ['d', review.mintId],
          ['u', review.mintUrl],
          ['a', `38172:${review.mintId}`]
        ]
      };

      const ndkEvent = new NDKEvent(ndk, event);
      await ndkEvent.sign();
      await ndkEvent.publish();

      showNotification('Review updated successfully', 'success');
      setEditingReview(null);
      
      // Refresh reviews
      const updatedReviews = userReviews.map(r => 
        r.id === review.id ? { ...r, content: editContent, rating: editRating } : r
      );
      setUserReviews(updatedReviews);
      
      // Refresh mints to update the review in the main list
      refreshMints();
    } catch (error) {
      logError(error, 'Updating review');
      showNotification('Failed to update review', 'error');
    }
  };

  const handleDeleteReview = async (review: any) => {
    if (!ndk || !window.confirm('Are you sure you want to delete this review?')) return;

    try {
      log.nostr('Deleting review:', review.id);

      // Create deletion event
      const event = {
        kind: 5,
        content: '',
        tags: [['e', review.id]]
      };

      const ndkEvent = new NDKEvent(ndk, event);
      await ndkEvent.sign();
      await ndkEvent.publish();

      showNotification('Review deleted successfully', 'success');
      
      // Remove from local state
      setUserReviews(current => current.filter(r => r.id !== review.id));
      
      // Refresh mints to update the main list
      refreshMints();
    } catch (error) {
      logError(error, 'Deleting review');
      showNotification('Failed to delete review', 'error');
    }
  };

  // Load suggested relays from Nostr
  const loadSuggestedRelays = async () => {
    if (!ndk) return;
    
    setLoadingRelays(true);
    setError(null);
    
    try {
      const events = await ndk.fetchEvents({
        kinds: [1986],
        limit: 10
      });

      const uniqueRelays = new Set<string>();
      
      events.forEach(event => {
        try {
          const relayList = JSON.parse(event.content);
          if (Array.isArray(relayList)) {
            relayList.forEach(relay => {
              if (typeof relay === 'string' && relay.startsWith('wss://')) {
                uniqueRelays.add(relay);
              }
            });
          }
        } catch (e) {
          console.debug('Skipping invalid relay list:', e);
        }
      });

      setSuggestedRelays(Array.from(uniqueRelays));
      
      if (uniqueRelays.size === 0) {
        setError('No valid relay suggestions found');
      }
    } catch (error) {
      console.error('Error loading suggested relays:', error);
      setError('Failed to load suggested relays');
    } finally {
      setLoadingRelays(false);
    }
  };

  const handleAddRelay = () => {
    if (!customRelay.startsWith('wss://')) {
      showNotification('Relay URL must start with wss://', 'error');
      return;
    }

    if (relays.includes(customRelay)) {
      showNotification('Relay already added', 'error');
      return;
    }

    const newRelays = [...relays, customRelay];
    setRelays(newRelays);
    localStorage.setItem('nostr:relays', JSON.stringify(newRelays));
    setCustomRelay('');
    showNotification('Relay added successfully', 'success');
  };

  const handleRemoveRelay = (relay: string) => {
    const newRelays = relays.filter(r => r !== relay);
    setRelays(newRelays);
    localStorage.setItem('nostr:relays', JSON.stringify(newRelays));
    showNotification('Relay removed', 'success');
  };

  const handleAddSuggestedRelay = (relay: string) => {
    if (relays.includes(relay)) {
      showNotification('Relay already added', 'error');
      return;
    }

    const newRelays = [...relays, relay];
    setRelays(newRelays);
    localStorage.setItem('nostr:relays', JSON.stringify(newRelays));
    showNotification('Relay added successfully', 'success');
  };

  const clearCache = () => {
    try {
      // Clear IndexedDB
      window.indexedDB.deleteDatabase('cashumints-cache');
      
      // Clear localStorage except for critical items
      const criticalItems = ['nostr:relays'];
      Object.keys(localStorage).forEach(key => {
        if (!criticalItems.includes(key)) {
          localStorage.removeItem(key);
        }
      });

      // Refresh the mints
      refreshMints();

      showNotification('Cache cleared successfully', 'success');
    } catch (error) {
      console.error('Error clearing cache:', error);
      showNotification('Failed to clear cache', 'error');
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[#1a1f2e]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-8">
            {/* Settings Section */}
            <section>
              <div className="bg-gray-800 rounded-2xl p-6">
                <h2 className="text-2xl font-bold mb-6">Settings</h2>
                
                {/* Zap Settings */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">Zap Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Default Zap Amount (sats)
                      </label>
                      <input
                        type="number"
                        value={defaultZapAmount}
                        onChange={(e) => setDefaultZapAmount(e.target.value)}
                        onBlur={() => {
                          const amount = parseInt(defaultZapAmount, 10);
                          if (amount > 0) {
                            updateSettings({ defaultZapAmount: amount });
                            showNotification('Default zap amount updated', 'success');
                          }
                        }}
                        className="bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#f5a623] w-full sm:w-auto"
                        min="1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Nostr Wallet Connect
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={nwcInput}
                          onChange={(e) => setNwcInput(e.target.value)}
                          placeholder="nostr+walletconnect://..."
                          className="flex-grow bg-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#f5a623]"
                        />
                        <button
                          onClick={() => {
                            if (updateNWC(nwcInput)) {
                              showNotification('NWC settings updated', 'success');
                              setNwcInput('');
                            } else {
                              showNotification('Invalid NWC URL', 'error');
                            }
                          }}
                          className="inline-flex items-center space-x-2 bg-[#f5a623] text-black px-4 py-2 rounded-lg hover:bg-[#d48c1c] transition-colors whitespace-nowrap"
                        >
                          <Wallet className="h-4 w-4" />
                          <span>Connect Wallet</span>
                        </button>
                      </div>
                    </div>

                    {settings.nwcUrl && (
                      <div className="bg-gray-700/50 backdrop-blur rounded-xl p-4">
                        <div className="flex items-start space-x-3">
                          <Wallet className="h-5 w-5 text-[#f5a623] flex-shrink-0 mt-0.5" />
                          <div className="flex-grow">
                            <h4 className="font-medium text-[#f5a623] mb-2">Connected Wallet</h4>
                            <div className="space-y-1 text-sm">
                              <p className="text-gray-300">
                                Pubkey: {settings.nwcPubkey?.slice(0, 10)}...
                              </p>
                              <p className="text-gray-300">
                                Relay: {settings.nwcRelay}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              updateSettings({
                                nwcUrl: undefined,
                                nwcPubkey: undefined,
                                nwcRelay: undefined,
                                nwcSecret: undefined
                              });
                              showNotification('Wallet disconnected', 'success');
                            }}
                            className="text-red-500 hover:text-red-400"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Cache Management */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold mb-4">Cache Management</h3>
                  <button
                    onClick={clearCache}
                    className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition-colors"
                  >
                    <Settings className="h-5 w-5" />
                    <span>Clear Local Cache</span>
                  </button>
                  <p className="text-sm text-gray-400 mt-2">
                    This will clear all cached data and refresh the mint list.
                  </p>
                </div>

                {/* Relay Management */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Relay Management</h3>
                    <button
                      onClick={() => {
                        setShowRelayManager(!showRelayManager);
                        if (!showRelayManager) {
                          loadSuggestedRelays();
                        }
                      }}
                      className="flex items-center space-x-2 bg-gray-700 px-3 py-1 rounded-xl hover:bg-gray-600"
                    >
                      <Radio className="h-4 w-4" />
                      <span>{showRelayManager ? 'Close' : 'Manage'}</span>
                    </button>
                  </div>

                  {showRelayManager && (
                    <div className="space-y-4">
                      {/* Add Custom Relay */}
                      <div>
                        <label className="block text-sm font-medium mb-2">Add Custom Relay</label>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={customRelay}
                            onChange={(e) => setCustomRelay(e.target.value)}
                            placeholder="wss://relay.example.com"
                            className="flex-1 bg-gray-700 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#f5a623]"
                          />
                          <button
                            onClick={handleAddRelay}
                            className="bg-[#f5a623] text-black px-4 py-2 rounded-xl hover:bg-[#d48c1c]"
                          >
                            Add
                          </button>
                        </div>
                      </div>

                      {/* Current Relays */}
                      <div>
                        <h4 className="text-sm font-medium mb-2">Current Relays</h4>
                        <div className="space-y-2">
                          {relays.map((relay) => (
                            <div
                              key={relay}
                              className="flex items-center justify-between bg-gray-700 rounded-xl px-4 py-2"
                            >
                              <span className="text-sm">{relay}</span>
                              <button
                                onClick={() => handleRemoveRelay(relay)}
                                className="text-red-500 hover:text-red-400"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                          {relays.length === 0 && (
                            <p className="text-sm text-gray-400">No relays configured</p>
                          )}
                        </div>
                      </div>

                      {/* Suggested Relays */}
                      <div>
                        <h4 className="text-sm font-medium mb-2">Suggested Relays</h4>
                        {loadingRelays ? (
                          <div className="flex items-center justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-[#f5a623]" />
                          </div>
                        ) : suggestedRelays.length > 0 ? (
                          <div className="space-y-2">
                            {suggestedRelays.map((relay) => (
                              <div
                                key={relay}
                                className="flex items-center justify-between bg-gray-700 rounded-xl px-4 py-2"
                              >
                                <span className="text-sm">{relay}</span>
                                <button
                                  onClick={() => handleAddSuggestedRelay(relay)}
                                  className="text-[#f5a623] hover:text-[#d48c1c]"
                                  disabled={relays.includes(relay)}
                                >
                                  {relays.includes(relay) ? (
                                    <span className="text-gray-500">Added</span>
                                  ) : (
                                    <span>Add</span>
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-400">
                            {error || 'No suggested relays found'}
                          </p>
                        )}
                      </div>

                      {error && (
                        <div className="flex items-center space-x-2 text-red-500 text-sm">
                          <AlertCircle className="h-4 w-4" />
                          <span>{error}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* My Reviews Section */}
            <section>
              <div className="bg-gray-800 rounded-2xl p-6">
                <div className="flex items-center space-x-3 mb-6">
                  <MessageSquare className="h-6 w-6 text-[#f5a623]" />
                  <h2 className="text-2xl font-bold">My Reviews</h2>
                </div>

                <div className="space-y-4">
                  {loadingReviews ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-[#f5a623]" />
                    </div>
                  ) : userReviews.length > 0 ? (
                    userReviews.map(review => (
                      <div key={review.id} className="bg-gray-700/50 backdrop-blur rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-[#f5a623]">{review.mintName}</h3>
                            <a 
                              href={review.mintUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-white"
                            >
                              <Link className="h-4 w-4" />
                            </a>
                          </div>
                          <div className="flex items-center space-x-2">
                            {editingReview === review.id ? (
                              <StarRating 
                                rating={editRating} 
                                onRatingChange={setEditRating} 
                                interactive 
                                size="sm" 
                              />
                            ) : (
                              <div className="flex items-center space-x-2">
                                <Star className="h-4 w-4 text-yellow-500" />
                                <span>{review.rating}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {editingReview === review.id ? (
                          <div className="space-y-3">
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="w-full bg-gray-600 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#f5a623]"
                              rows={3}
                            />
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={() => setEditingReview(null)}
                                className="px-3 py-1 text-sm rounded-lg bg-gray-600 hover:bg-gray-500 transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleSaveEdit(review)}
                                className="flex items-center space-x-1 px-3 py-1 text-sm rounded-lg bg-[#f5a623] text-black hover:bg-[#d48c1c] transition-colors"
                              >
                                <Save className="h-4 w-4" />
                                <span>Save</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-gray-300 mb-3">{review.content}</p>
                            <div className="flex items-center justify-between text-sm">
                              <div className="flex items-center text-gray-400">
                                <Calendar className="h-4 w-4 mr-2" />
                                <span>
                                  {new Date(review.createdAt * 1000).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleEditReview(review)}
                                  className="p-1 text-gray-400 hover:text-white transition-colors"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteReview(review)}
                                  className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 bg-gray-700/50 backdrop-blur rounded-xl">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                      <p className="text-gray-400">You haven't written any reviews yet</p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Dashboard;