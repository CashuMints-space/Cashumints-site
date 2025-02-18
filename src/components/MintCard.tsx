import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, Star, MessageCircle, Globe } from 'lucide-react';
import type { CashuMint } from '../types/mint';
import StarRating from './StarRating';

interface MintCardProps {
  mint: CashuMint;
  compact?: boolean;
}

const MintCard: React.FC<MintCardProps> = ({ mint, compact = false }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/mint/${mint.id}`);
  };

  // Count actual reviews (recommendations with text)
  const reviewCount = mint.recommendations.filter(r => {
    const ratingMatch = r.content.match(/^\[(\d+)\/5\]/);
    return ratingMatch !== null;
  }).length;

  return (
    <div 
      onClick={handleClick}
      className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg p-4 sm:p-6 hover:from-gray-700 hover:to-gray-800 transition-all duration-200 shadow-lg cursor-pointer transform hover:-translate-y-1 max-w-full overflow-hidden"
    >
      <div className="flex items-start space-x-4">
        <div className="flex flex-col items-center space-y-2 flex-shrink-0">
          <div className="flex items-center space-x-1">
            <ThumbsUp className="h-5 w-5 text-green-500" />
            <span className="text-green-500 font-medium">{mint.likes}</span>
          </div>
          {mint.dislikes > 0 && (
            <div className="flex items-center space-x-1">
              <ThumbsDown className="h-5 w-5 text-red-500" />
              <span className="text-red-500 font-medium">{mint.dislikes}</span>
            </div>
          )}
        </div>
        
        <div className="flex-grow min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 space-y-2 sm:space-y-0">
            <div>
              <h3 className="text-xl font-bold text-white mb-1 truncate">{mint.name}</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Globe className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{mint.network}</span>
                <span>•</span>
                <MessageCircle className="h-4 w-4 flex-shrink-0" />
                <span>{reviewCount} reviews</span>
              </div>
            </div>
            <div className="flex flex-col items-start sm:items-end">
              {mint.rating > 0 && (
                <div className="flex mb-2">
                  <StarRating rating={mint.rating} />
                </div>
              )}
            </div>
          </div>
          
          {!compact && (
            <>
              <div className="flex flex-wrap gap-2 mb-3">
                {mint.nuts.map((nut, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-gray-700 rounded-full text-xs text-gray-300"
                  >
                    {nut}
                  </span>
                ))}
              </div>
              <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                {mint.description}
              </p>
            </>
          )}
          
          {mint.info?.motd && (
            <div className="mt-3 p-3 bg-gray-800 rounded-lg">
              <p className="text-sm text-[#f5a623] italic truncate">
                "{mint.info.motd}"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MintCard;