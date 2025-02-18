import React from 'react';
import { Link } from 'react-router-dom';
import { CashuMint } from '../types/mint';
import StarRating from './StarRating';
import { ThumbsUp, ThumbsDown, MessageCircle } from 'lucide-react';

interface SimilarMintsProps {
  mints: CashuMint[];
  getNutLink: (nut: string) => string | null;
}

const SimilarMints: React.FC<SimilarMintsProps> = ({ mints }) => {
  if (mints.length === 0) return null;

  return (
    <>
      {mints.map(mint => (
        <Link
          key={mint.id}
          to={`/mint/${mint.id}`}
          className="group bg-gray-700/50 backdrop-blur rounded-xl p-4 hover:bg-gray-600/50 transition-all duration-200 transform hover:-translate-y-1"
        >
          <div className="flex items-start space-x-4">
            <div className="flex-grow min-w-0">
              <h3 className="font-semibold text-lg mb-2 text-white group-hover:text-[#f5a623] transition-colors">
                {mint.name}
              </h3>
              
              <div className="flex items-center space-x-4 mb-3">
                <StarRating rating={mint.rating} size="sm" />
                <span className="text-sm text-gray-400">
                  {mint.recommendations.length} reviews
                </span>
              </div>

              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center text-green-500">
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  <span>{mint.likes}</span>
                </div>
                <div className="flex items-center text-red-500">
                  <ThumbsDown className="h-4 w-4 mr-1" />
                  <span>{mint.dislikes}</span>
                </div>
                <div className="flex items-center text-gray-400">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  <span>{mint.recommendations.length}</span>
                </div>
              </div>
            </div>

            {mint.info?.icon_url && (
              <img 
                src={mint.info.icon_url} 
                alt={`${mint.name} icon`}
                className="w-12 h-12 rounded-lg flex-shrink-0 object-cover"
              />
            )}
          </div>
        </Link>
      ))}
    </>
  );
};

export default SimilarMints;