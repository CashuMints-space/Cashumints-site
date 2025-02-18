import React, { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  interactive?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const StarRating: React.FC<StarRatingProps> = ({ 
  rating, 
  onRatingChange, 
  interactive = false,
  size = 'md'
}) => {
  const [hoveredStar, setHoveredStar] = useState(0);

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-4 w-4 md:h-3 md:w-3';
      case 'lg':
        return 'h-8 w-8 md:h-6 md:w-6';
      default:
        return 'h-5 w-5 md:h-4 md:w-4';
    }
  };

  const renderStar = (position: number) => {
    const isHalf = position - 0.5 === rating;
    const isFilled = position <= (hoveredStar || rating);
    const isPartiallyFilled = !isFilled && isHalf;

    return (
      <button
        key={position}
        type={interactive ? 'button' : undefined}
        onClick={interactive && onRatingChange ? () => onRatingChange(position) : undefined}
        onMouseEnter={interactive ? () => setHoveredStar(position) : undefined}
        onMouseLeave={interactive ? () => setHoveredStar(0) : undefined}
        className={`${interactive ? 'cursor-pointer' : ''} focus:outline-none relative`}
      >
        {isPartiallyFilled ? (
          <div className="relative">
            <Star className={`${getSizeClasses()} text-gray-400`} />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star className={`${getSizeClasses()} text-yellow-500 fill-current`} />
            </div>
          </div>
        ) : (
          <Star 
            className={`${getSizeClasses()} ${
              isFilled
                ? 'text-yellow-500 fill-current'
                : 'text-gray-400'
            }`}
          />
        )}
      </button>
    );
  };

  return (
    <div className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map(position => renderStar(position))}
    </div>
  );
};

export default StarRating;