import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  AlertTriangle, 
  Shield, 
  Globe, 
  ExternalLink, 
  ThumbsUp, 
  ThumbsDown, 
  Info, 
  Copy, 
  QrCode 
} from 'lucide-react';
import StarRating from '../StarRating';
import type { CashuMint, MintInfo } from '../../types/mint';

interface MintHeaderProps {
  mint: CashuMint;
  mintInfo: MintInfo | null;
  onCopyUrl: () => void;
  onToggleQR: () => void;
  showQR: boolean;
}

const MintHeader: React.FC<MintHeaderProps> = ({
  mint,
  mintInfo,
  onCopyUrl,
  onToggleQR,
  showQR
}) => {
  const isPegOutOnly = mint.nuts.includes('4-peg-out');

  return (
    <div className="bg-gradient-to-b from-gray-900 to-[#1a1f2e] border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link 
          to="/" 
          className="inline-flex items-center text-[#f5a623] hover:text-[#d48c1c] transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span>Back to Mints</span>
        </Link>

        {isPegOutOnly && (
          <div className="mb-6 bg-yellow-900/50 border border-yellow-700/50 rounded-xl p-4 backdrop-blur">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-[#f5a623] flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-[#f5a623] mb-1">Peg-out Only Mint</h3>
                <p className="text-sm text-gray-300">
                  This mint only supports peg-out operations. You cannot deposit or store funds here.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0 rounded-2xl overflow-hidden bg-gray-700 flex items-center justify-center">
            {mintInfo?.icon_url ? (
              <img 
                src={mintInfo.icon_url} 
                alt={`${mint.name} icon`}
                className="w-full h-full object-cover"
              />
            ) : (
              <Shield className="w-12 h-12 md:w-16 md:h-16 text-gray-500" />
            )}
          </div>

          <div className="flex-grow min-w-0">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 break-words">
              {mint.name || mint.url}
            </h1>

            <a 
              href={mint.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-[#f5a623] hover:text-[#d48c1c] transition-colors mb-4"
            >
              <Globe className="h-4 w-4 mr-2" />
              <span className="break-all">{mint.url}</span>
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
            
            <div className="flex flex-wrap items-center gap-6 mb-4">
              <div className="flex items-center">
                <StarRating rating={mint.rating} size="lg" />
                <span className="ml-2 text-gray-400">
                  ({mint.recommendations.length} reviews)
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <ThumbsUp className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-green-500 font-medium">{mint.likes}</span>
                </div>
                <div className="flex items-center">
                  <ThumbsDown className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-red-500 font-medium">{mint.dislikes}</span>
                </div>
              </div>
            </div>

            {mintInfo?.description && (
              <div className="bg-gray-800/50 backdrop-blur rounded-xl p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <Info className="h-5 w-5 text-[#f5a623] flex-shrink-0 mt-1" />
                  <p className="text-gray-300 text-lg break-words">
                    {mintInfo.description}
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <button
                onClick={onCopyUrl}
                className="inline-flex items-center px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
              >
                <Copy className="h-4 w-4 mr-2" />
                <span>Copy URL</span>
              </button>
              <button
                onClick={onToggleQR}
                className="inline-flex items-center px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
              >
                <QrCode className="h-4 w-4 mr-2" />
                <span>QR Code</span>
              </button>
              <a
                href={`https://wallet.cashu.me/?mint=${encodeURIComponent(mint.url)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-[#f5a623] text-black rounded-lg hover:bg-[#d48c1c] transition-colors"
              >
                <Globe className="h-4 w-4 mr-2" />
                <span>Open in Cashu.me</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MintHeader;