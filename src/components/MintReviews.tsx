import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Send, 
  Loader2, 
  X, 
  User, 
  ExternalLink, 
  CheckCircle,
  ArrowUpDown,
  Edit,
  Trash2,
  Save,
  Link,
  Calendar,
  MessageSquare,
  Star,
  Filter,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { MintRecommendation } from '../types/mint';
import StarRating from './StarRating';
import { useWindowSize } from '../hooks/useWindowSize';
import { useNDK } from '../hooks/useNDK';
import { useNotification } from '../context/NotificationContext';
import { log } from '../lib/debug';
import { nip19 } from 'nostr-tools';
import ZapButton from './ZapButton';

interface MintReviewsProps {
  recommendations: MintRecommendation[];
  mintId: string;
  publicKey: string | null;
  onSubmitReview: (content: string, rating: number) => Promise<void>;
  onDeleteReview?: (reviewId: string) => Promise<void>;
  onEditReview?: (reviewId: string, content: string, rating: number) => Promise<void>;
}

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];
const DEFAULT_ITEMS_PER_PAGE = 10;

const MintReviews: React.FC<MintReviewsProps> = ({
  recommendations,
  mintId,
  publicKey,
  onSubmitReview,
  onDeleteReview,
  onEditReview
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewContent, setReviewContent] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest'>('newest');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const { width } = useWindowSize();
  const { showNotification } = useNotification();
  const [editingReview, setEditingReview] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editRating, setEditRating] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);

  const userReview = useMemo(() => {
    if (!publicKey) return null;
    return recommendations.find(rec => rec.pubkey === publicKey);
  }, [publicKey, recommendations]);

  // Extract rating from review content according to NIP-87
  const extractRating = (content: string): number => {
    const ratingMatch = content.match(/^\[(\d+)\/5\]/);
    return ratingMatch ? parseInt(ratingMatch[1], 10) : 5;
  };

  // Clean content by removing the rating prefix
  const cleanContent = (content: string): string => {
    return content.replace(/^\[(\d+)\/5\]\s*/, '');
  };

  const handleLoginToReview = () => {
    navigate('/login', { 
      state: { 
        from: location,
        mintId
      } 
    });
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (userReview && !editingReview) {
      showNotification('You have already reviewed this mint. Please edit your existing review instead.', 'error');
      return;
    }
    
    setSubmitting(true);
    setSubmitSuccess(false);
    
    try {
      // Format review content according to NIP-87
      const formattedContent = `[${rating}/5]${reviewContent.trim() ? ` ${reviewContent.trim()}` : ''}`;

      log.nostr('Submitting review:', { content: formattedContent });
      await onSubmitReview(formattedContent, rating);
      
      setSubmitSuccess(true);
      setReviewContent('');
      setRating(5);
      
      setTimeout(() => {
        setSubmitSuccess(false);
        setShowReviewForm(false);
      }, 2000);
    } catch (error) {
      log.error('Error submitting review:', error);
      showNotification('Failed to submit review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditReview = (review: MintRecommendation) => {
    setEditingReview(review.id);
    setEditContent(cleanContent(review.content));
    setEditRating(extractRating(review.content));
  };

  const handleSaveEdit = async (review: MintRecommendation) => {
    if (!onEditReview) return;
    
    try {
      // Format edited content according to NIP-87
      const formattedContent = `[${editRating}/5]${editContent.trim() ? ` ${editContent.trim()}` : ''}`;

      await onEditReview(review.id, formattedContent, editRating);
      setEditingReview(null);
    } catch (error) {
      log.error('Error editing review:', error);
      showNotification('Failed to update review', 'error');
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!onDeleteReview) return;
    
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await onDeleteReview(reviewId);
      } catch (error) {
        log.error('Error deleting review:', error);
        showNotification('Failed to delete review', 'error');
      }
    }
  };

  const filteredAndSortedRecommendations = useMemo(() => {
    let result = [...recommendations];

    if (filterRating !== null) {
      result = result.filter(rec => {
        const rating = extractRating(rec.content);
        return rating === filterRating;
      });
    }

    return result.sort((a, b) => {
      const ratingA = extractRating(a.content);
      const ratingB = extractRating(b.content);

      switch (sortBy) {
        case 'newest':
          return b.createdAt - a.createdAt;
        case 'oldest':
          return a.createdAt - b.createdAt;
        case 'highest':
          return ratingB - ratingA;
        case 'lowest':
          return ratingA - ratingB;
        default:
          return 0;
      }
    });
  }, [recommendations, sortBy, filterRating]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredAndSortedRecommendations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRecommendations = filteredAndSortedRecommendations.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to the reviews section instead of the top of the page
    const reviewsSection = document.getElementById('reviews-section');
    if (reviewsSection) {
      reviewsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const formatNpub = (pubkey: string, displayName?: string): string => {
    try {
      const npub = nip19.npubEncode(pubkey);
      
      if (displayName) {
        return displayName;
      }

      let visibleChars = 8;
      if (width >= 640) visibleChars = 12;
      if (width >= 768) visibleChars = 16;
      if (width >= 1024) visibleChars = 20;

      if (width < 375 || !displayName) {
        return `${npub.slice(0, 10)}...`;
      }

      return npub.length <= visibleChars * 2 
        ? npub 
        : `${npub.slice(0, visibleChars)}...${npub.slice(-visibleChars)}`;
    } catch (error) {
      console.warn('Error encoding npub:', error);
      return pubkey.slice(0, 10) + '...';
    }
  };

  const getNjumpUrl = (pubkey: string) => {
    try {
      const npub = nip19.npubEncode(pubkey);
      return `https://njump.me/${npub}`;
    } catch (error) {
      console.warn('Error generating njump URL:', error);
      return null;
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 p-6">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Reviews</h2>
          <p className="text-gray-400">
            {recommendations.length} {recommendations.length === 1 ? 'review' : 'reviews'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="appearance-none bg-gray-700 text-white px-4 py-2 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f5a623] w-full sm:w-auto"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rated</option>
              <option value="lowest">Lowest Rated</option>
            </select>
            <ArrowUpDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="appearance-none bg-gray-700 text-white px-4 py-2 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#f5a623] w-full sm:w-auto"
            >
              {ITEMS_PER_PAGE_OPTIONS.map(option => (
                <option key={option} value={option}>{option} per page</option>
              ))}
            </select>
            <ArrowUpDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
          {publicKey ? (
            !showReviewForm && !userReview && (
              <button
                onClick={() => setShowReviewForm(true)}
                className="inline-flex items-center space-x-2 bg-[#f5a623] text-black px-4 py-2 rounded-lg hover:bg-[#d48c1c] transition-colors w-full sm:w-auto justify-center"
              >
                <Send className="h-4 w-4" />
                <span>Write Review</span>
              </button>
            )
          ) : (
            <button
              onClick={handleLoginToReview}
              className="inline-flex items-center space-x-2 bg-[#f5a623] text-black px-4 py-2 rounded-lg hover:bg-[#d48c1c] transition-colors w-full sm:w-auto justify-center"
            >
              <Send className="h-4 w-4" />
              <span>Login to Review</span>
            </button>
          )}
        </div>
      </div>

      {showReviewForm && (
        <div className="bg-gray-700 rounded-lg p-6 mb-6 mx-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Rate this Mint</h3>
            <button
              onClick={() => setShowReviewForm(false)}
              className="text-gray-400 hover:text-white p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {submitting ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-[#f5a623] mb-4" />
              <p className="text-gray-300">Publishing your review...</p>
            </div>
          ) : submitSuccess ? (
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle className="w-8 h-8 text-green-500 mb-4" />
              <p className="text-gray-300">Review published successfully!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview}>
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Rating</label>
                <StarRating rating={rating} onRatingChange={setRating} interactive size="lg" />
              </div>
              <textarea
                value={reviewContent}
                onChange={(e) => setReviewContent(e.target.value)}
                className="w-full bg-gray-600 rounded-lg p-4 mb-4 focus:outline-none focus:ring-2 focus:ring-[#f5a623] resize-y min-h-[120px]"
                placeholder="Share your experience with this mint..."
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center space-x-2 bg-[#f5a623] text-black px-6 py-2 rounded-lg hover:bg-[#d48c1c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                  <span>Submit Review</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="space-y-4 px-6">
        {paginatedRecommendations.length > 0 ? (
          <>
            {paginatedRecommendations.map(rec => (
              <div key={rec.id} className="bg-gray-700/50 backdrop-blur rounded-xl p-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {rec.profile?.image ? (
                      <img 
                        src={rec.profile.image} 
                        alt={rec.profile.name || 'User'} 
                        className="w-12 h-12 rounded-full"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://api.dicebear.com/7.x/identicon/svg?seed=${rec.pubkey}`;
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center">
                        <User className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium truncate">
                            {formatNpub(rec.pubkey, rec.profile?.name || rec.profile?.displayName)}
                          </span>
                          {rec.pubkey === publicKey && (
                            <span className="text-xs bg-[#f5a623]/20 text-[#f5a623] px-2 py-0.5 rounded-full">
                              Your Review
                            </span>
                          )}
                        </div>
                        {getNjumpUrl(rec.pubkey) && (
                          <a
                            href={getNjumpUrl(rec.pubkey)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center space-x-1 text-xs text-gray-400 mt-1 hover:text-[#f5a623] transition-colors"
                          >
                            <span className="break-all">{formatNpub(rec.pubkey)}</span>
                            <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                        )}
                      </div>
                      <div className="flex items-center space-x-3">
                        <StarRating rating={extractRating(rec.content)} size="sm" />
                        <ZapButton pubkey={rec.pubkey} eventId={rec.id} small />
                      </div>
                    </div>
                    
                    {editingReview === rec.id ? (
                      <div className="space-y-4">
                        <div className="mb-2">
                          <StarRating 
                            rating={editRating} 
                            onRatingChange={setEditRating} 
                            interactive 
                            size="sm" 
                          />
                        </div>
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
                            onClick={() => handleSaveEdit(rec)}
                            className="flex items-center space-x-1 px-3 py-1 text-sm rounded-lg bg-[#f5a623] text-black hover:bg-[#d48c1c] transition-colors"
                          >
                            <Save className="h-4 w-4" />
                            <span>Save</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-gray-300 mb-3 break-words whitespace-pre-wrap">
                          {cleanContent(rec.content)}
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-gray-400">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>
                              {new Date(rec.createdAt * 1000).toLocaleDateString()}
                            </span>
                          </div>
                          {rec.pubkey === publicKey && (
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleEditReview(rec)}
                                className="p-1 text-gray-400 hover:text-white transition-colors"
                                title="Edit review"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteReview(rec.id)}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                title="Delete review"
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
            ))}
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 bg-gray-700/50 backdrop-blur rounded-xl p-4">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Previous</span>
                </button>
                <div className="flex items-center space-x-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                        currentPage === page
                          ? 'bg-[#f5a623] text-black'
                          : 'bg-gray-600 hover:bg-gray-500'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Next</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 bg-gray-700/50 backdrop-blur rounded-xl">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-500" />
            <p className="text-gray-400 mb-2">No reviews yet</p>
            <p className="text-sm text-gray-500">
              {filterRating !== null 
                ? 'No reviews match your filter. Try adjusting your criteria.'
                : 'Be the first to review this mint!'
              }
            </p>
          </div>
        )}
      </div>

      {filterRating !== null && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 rounded-lg shadow-lg px-4 py-2 flex items-center space-x-2">
          <span className="text-sm">Showing {filterRating}-star reviews</span>
          <button
            onClick={() => setFilterRating(null)}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default MintReviews;