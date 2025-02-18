import React from 'react';
import { Loader2 } from 'lucide-react';
import type { CashuMint, MintInfo } from '../../types/mint';
import MintInfo from '../MintInfo';
import MintReviews from '../MintReviews';
import SimilarMints from '../SimilarMints';
import ShareButtons from '../ShareButtons';
import Discussion from '../Discussion';

interface MintContentProps {
  mint: CashuMint;
  mintInfo: MintInfo | null;
  loading: boolean;
  publicKey: string | null;
  qrCode: string;
  showQR: boolean;
  onCloseQR: () => void;
  onShare: () => void;
  onNostrShare: () => void;
  onSubmitReview: (content: string, rating: number) => Promise<void>;
  onDeleteReview: (reviewId: string) => Promise<void>;
  onEditReview: (reviewId: string, content: string, rating: number) => Promise<void>;
  renderContactLink: (method: string, info: string) => React.ReactNode;
  similarMints: CashuMint[];
  getNutLink: (nut: string) => string | null;
}

const MintContent: React.FC<MintContentProps> = ({
  mint,
  mintInfo,
  loading,
  publicKey,
  qrCode,
  showQR,
  onCloseQR,
  onShare,
  onNostrShare,
  onSubmitReview,
  onDeleteReview,
  onEditReview,
  renderContactLink,
  similarMints,
  getNutLink
}) => {
  return (
    <div className="flex-grow space-y-8">
      {/* QR Code - Shown on mobile above Technical Details */}
      {showQR && qrCode && (
        <div className="lg:hidden bg-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">QR Code</h2>
            <button
              onClick={onCloseQR}
              className="text-gray-400 hover:text-white"
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div className="flex justify-center">
            <img 
              src={qrCode} 
              alt="Mint QR Code" 
              className="w-48 h-48 rounded-lg"
            />
          </div>
        </div>
      )}

      {/* QR Code - Hidden on mobile, shown in content area on desktop */}
      {showQR && qrCode && (
        <div className="hidden lg:block bg-gray-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">QR Code</h2>
            <button
              onClick={onCloseQR}
              className="text-gray-400 hover:text-white"
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          <div className="flex justify-center">
            <img 
              src={qrCode} 
              alt="Mint QR Code" 
              className="w-48 h-48 rounded-lg"
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-gray-800 rounded-2xl p-6 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#f5a623]" />
        </div>
      ) : mintInfo ? (
        <div className="bg-gray-800 rounded-2xl overflow-hidden">
          <MintInfo
            mintInfo={mintInfo}
            renderContactLink={renderContactLink}
          />
        </div>
      ) : null}

      <div className="bg-gray-800 rounded-2xl overflow-hidden">
        <MintReviews
          recommendations={mint.recommendations}
          mintId={mint.id}
          publicKey={publicKey}
          onSubmitReview={onSubmitReview}
          onDeleteReview={onDeleteReview}
          onEditReview={onEditReview}
        />
      </div>

      <div className="bg-gray-800 rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-4">Share</h2>
        <div className="space-y-4">
          <ShareButtons
            mint={mint}
            onShare={onShare}
            onNostrShare={onNostrShare}
          />
          <div className="pt-4 border-t border-gray-700">
            <Discussion mintId={mint.id} mintUrl={mint.url} />
          </div>
        </div>
      </div>

      {similarMints.length > 0 && (
        <div className="bg-gray-800 rounded-2xl p-6">
          <h2 className="text-xl font-semibold mb-6">Similar Mints</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SimilarMints
              mints={similarMints}
              getNutLink={getNutLink}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MintContent;