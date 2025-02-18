import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { useNDK } from '../hooks/useNDK';
import { useMints } from '../context/MintsContext';
import { useNotification } from '../context/NotificationContext';
import QRCode from 'qrcode';
import Footer from '../components/Footer';
import { SharePopup, NostrSharePopup } from '../components/ShareButtons';
import type { MintInfo as MintInfoType } from '../types/mint';
import { getMonitorForUrl, cleanup as uptimeCleanup } from '../lib/uptime';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import MintHeader from '../components/mint/MintHeader';
import MintContent from '../components/mint/MintContent';
import MintSidebar from '../components/mint/MintSidebar';
import { Link } from 'react-router-dom';

const MintDetails: React.FC = () => {
  const { mintId } = useParams<{ mintId: string }>();
  const { mints, getMintInfo, recommendMint, refreshMints } = useMints();
  const { publicKey, ndk } = useNDK();
  const { showNotification } = useNotification();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [mintInfo, setMintInfo] = useState<MintInfoType | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [showNostrShare, setShowNostrShare] = useState(false);
  const [nostrShareContent, setNostrShareContent] = useState('');
  const [uptimeData, setUptimeData] = useState<any>(null);
  const [loadingUptime, setLoadingUptime] = useState(false);

  const mint = mints.find(m => m.id === mintId);

  const similarMints = React.useMemo(() => {
    if (!mint) return [];
    return mints
      .filter(m => m.id !== mintId && (
        m.network === mint.network ||
        m.nuts.some(nut => mint.nuts.includes(nut))
      ))
      .sort((a, b) => {
        const aMatches = a.nuts.filter(nut => mint.nuts.includes(nut)).length;
        const bMatches = b.nuts.filter(nut => mint.nuts.includes(nut)).length;
        return bMatches - aMatches;
      })
      .slice(0, 3);
  }, [mint, mints, mintId]);

  useEffect(() => {
    const loadMintInfo = async () => {
      if (mintId) {
        setLoading(true);
        const info = await getMintInfo(mintId);
        setMintInfo(info);
        setLoading(false);
      }
    };

    loadMintInfo();
  }, [mintId, getMintInfo]);

  useEffect(() => {
    const loadUptimeData = async () => {
      if (mint?.url) {
        try {
          setLoadingUptime(true);
          const data = await getMonitorForUrl(mint.url);
          setUptimeData(data);
        } catch (error) {
          console.error('Error loading uptime data:', error);
          showNotification('Failed to load uptime data', 'error');
        } finally {
          setLoadingUptime(false);
        }
      }
    };

    loadUptimeData();

    return () => {
      uptimeCleanup();
    };
  }, [mint?.url, showNotification]);

  useEffect(() => {
    if (mint?.url && showQR) {
      QRCode.toDataURL(mint.url)
        .then(url => setQrCode(url))
        .catch(err => console.error('Error generating QR code:', err));
    }
  }, [mint?.url, showQR]);

  const handleCopyUrl = () => {
    if (mint?.url) {
      navigator.clipboard.writeText(mint.url)
        .then(() => {
          showNotification('URL copied to clipboard', 'success');
        })
        .catch(err => {
          console.error('Error copying URL:', err);
          showNotification('Failed to copy URL', 'error');
        });
    }
  };

  const handleShare = async () => {
    if (!mint) return;

    const shareUrl = window.location.href;
    const shareTitle = `${mint.name} on CashuMints.space`;
    const shareText = `Check out ${mint.name} on CashuMints.space - A Cashu mint with ${mint.rating} stars and ${mint.recommendations.length} reviews.`;

    // Check if Web Share API is supported and available
    if (navigator.share && navigator.canShare) {
      const shareData = {
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      };

      // Check if the data can be shared
      if (navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData);
          return; // Exit if share was successful
        } catch (err) {
          // Only log the error if it's not an AbortError (user cancelled)
          if (!(err instanceof Error) || err.name !== 'AbortError') {
            console.warn('Share failed:', err);
          }
          // Continue to fallback
        }
      }
    }

    // Fallback to custom share popup
    setShowSharePopup(true);
  };

  const handleNostrShare = async () => {
    if (!ndk || !publicKey) {
      navigate('/login', { state: { from: location } });
      return;
    }

    try {
      const defaultContent = `I just rated this mint on CashuMints.space\n\n${mint?.name}\n${window.location.href}`;
      setNostrShareContent(defaultContent);
      setShowNostrShare(true);
    } catch (error) {
      console.warn('Error preparing Nostr share:', error);
      showNotification('Failed to prepare share content', 'error');
    }
  };

  const publishNostrShare = async () => {
    if (!ndk || !publicKey || !nostrShareContent.trim() || !mint) {
      showNotification('Unable to share at this time', 'error');
      return;
    }

    try {
      const event = {
        kind: 1,
        content: nostrShareContent,
        tags: [
          ['r', window.location.href],
          ['t', 'cashu'],
          ['t', 'mint'],
          ['r', mint.url],
          ['title', `Review of ${mint.name}`]
        ]
      };

      const ndkEvent = new NDKEvent(ndk, event);
      await ndkEvent.sign();
      await ndkEvent.publish();
      
      setShowNostrShare(false);
      showNotification('Successfully shared on Nostr!', 'success');
    } catch (error) {
      console.warn('Error sharing on Nostr:', error);
      showNotification(
        error instanceof Error ? error.message : 'Failed to share on Nostr', 
        'error'
      );
    }
  };

  const renderContactLink = (method: string, info: string) => {
    let href = info;
    let display = info;

    switch (method) {
      case 'email':
        href = `mailto:${info}`;
        break;
      case 'twitter':
        href = info.startsWith('http') ? info : `https://twitter.com/${info.replace('@', '')}`;
        break;
      case 'website':
        href = info.startsWith('http') ? info : `https://${info}`;
        break;
      default:
        break;
    }

    return (
      <a
        href={href}
        target={method !== 'email' ? '_blank' : undefined}
        rel={method !== 'email' ? 'noopener noreferrer' : undefined}
        className="text-gray-300 hover:text-white transition-colors block truncate"
      >
        {display}
      </a>
    );
  };

  const getNutLink = (nut: string) => {
    const nutNumber = nut.match(/^\d+/)?.[0];
    if (!nutNumber) return null;
    return `https://github.com/cashubtc/nuts/blob/main/${nutNumber.padStart(2, '0')}.md`;
  };

  const handleSubmitReview = async (content: string, rating: number) => {
    if (!mint) return;
    await recommendMint(mint.id, content, rating);
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!ndk || !publicKey) return;

    try {
      console.log('Creating deletion event:', reviewId);
      const event = {
        kind: 5,
        content: '',
        tags: [
          ['e', reviewId],
          ['k', '38000']
        ]
      };

      const ndkEvent = new NDKEvent(ndk, event);
      await ndkEvent.sign();
      await ndkEvent.publish();
      
      await refreshMints();
      showNotification('Review deleted successfully', 'success');
    } catch (error) {
      console.error(error);
      showNotification('Failed to delete review', 'error');
    }
  };

  const handleEditReview = async (reviewId: string, content: string, rating: number) => {
    if (!ndk || !publicKey || !mint) return;

    try {
      console.log('Updating review:', { reviewId, content, rating });
      
      // Create deletion event for the old review
      const deleteEvent = {
        kind: 5,
        content: '',
        tags: [
          ['e', reviewId],
          ['k', '38000']
        ]
      };

      const ndkDeleteEvent = new NDKEvent(ndk, deleteEvent);
      await ndkDeleteEvent.sign();
      await ndkDeleteEvent.publish();

      // Create new review with updated content
      await recommendMint(mint.id, content, rating);
      showNotification('Review updated successfully', 'success');
    } catch (error) {
      console.error(error);
      showNotification('Failed to update review', 'error');
    }
  };

  if (!mint) {
    return (
      <div className="min-h-screen bg-[#1a1f2e] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-gray-800 rounded-2xl p-8 text-center">
          <Shield className="h-16 w-16 mx-auto mb-4 text-red-500 opacity-75" />
          <h1 className="text-2xl font-bold text-red-500 mb-4">Mint not found</h1>
          <p className="text-gray-400 mb-6">The mint you're looking for doesn't exist or has been removed.</p>
          <Link 
            to="/" 
            className="inline-flex items-center text-[#f5a623] hover:text-[#d48c1c] transition-colors"
          >
            <span>Return to Home</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#1a1f2e]">
        <MintHeader
          mint={mint}
          mintInfo={mintInfo}
          onCopyUrl={handleCopyUrl}
          onToggleQR={() => setShowQR(!showQR)}
          showQR={showQR}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Mobile Sidebar */}
            <div className="lg:hidden space-y-8">
              <MintSidebar
                mint={mint}
                mintInfo={mintInfo}
                uptimeData={uptimeData}
                loadingUptime={loadingUptime}
                getNutLink={getNutLink}
              />
            </div>

            {/* Main Content */}
            <MintContent
              mint={mint}
              mintInfo={mintInfo}
              loading={loading}
              publicKey={publicKey}
              qrCode={qrCode}
              showQR={showQR}
              onCloseQR={() => setShowQR(false)}
              onShare={handleShare}
              onNostrShare={handleNostrShare}
              onSubmitReview={handleSubmitReview}
              onDeleteReview={handleDeleteReview}
              onEditReview={handleEditReview}
              renderContactLink={renderContactLink}
              similarMints={similarMints}
              getNutLink={getNutLink}
            />

            {/* Desktop Sidebar */}
            <div className="hidden lg:block lg:w-96 space-y-8">
              <MintSidebar
                mint={mint}
                mintInfo={mintInfo}
                uptimeData={uptimeData}
                loadingUptime={loadingUptime}
                getNutLink={getNutLink}
              />
            </div>
          </div>
        </div>
      </div>

      {showSharePopup && <SharePopup onClose={() => setShowSharePopup(false)} />}
      {showNostrShare && (
        <NostrSharePopup
          content={nostrShareContent}
          onContentChange={setNostrShareContent}
          onShare={publishNostrShare}
          onClose={() => setShowNostrShare(false)}
        />
      )}
      <Footer />
    </>
  );
};

export default MintDetails;