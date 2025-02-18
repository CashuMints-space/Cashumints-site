import React from 'react';
import { Share2, MessageSquare, Twitter, Facebook, Linkedin, Copy, X } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';

interface ShareButtonsProps {
  mint: {
    name: string;
    rating: number;
    recommendations: any[];
  };
  onShare: () => void;
  onNostrShare: () => void;
}

const ShareButtons: React.FC<ShareButtonsProps> = ({ mint, onShare, onNostrShare }) => {
  const { showNotification } = useNotification();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    showNotification('Link copied to clipboard!', 'success');
  };

  return (
    <div className="mt-4 flex flex-wrap gap-4">
      <button
        onClick={onShare}
        className="flex items-center space-x-2 bg-gray-600 px-4 py-2 rounded-lg hover:bg-gray-500 transition-colors"
      >
        <Share2 className="h-4 w-4" />
        <span>Share</span>
      </button>
      
      <button
        onClick={onNostrShare}
        className="flex items-center space-x-2 bg-gray-600 px-4 py-2 rounded-lg hover:bg-gray-500 transition-colors"
      >
        <MessageSquare className="h-4 w-4" />
        <span>Share on Nostr</span>
      </button>
    </div>
  );
};

export const SharePopup: React.FC<{
  onClose: () => void;
}> = ({ onClose }) => {
  const { showNotification } = useNotification();

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    showNotification('Link copied to clipboard!', 'success');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Share Mint</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this mint on @CashuMints\n\n${window.location.href}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-2 bg-[#1DA1F2] text-white px-4 py-2 rounded-lg hover:bg-opacity-90"
          >
            <Twitter className="h-4 w-4" />
            <span>Twitter</span>
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-2 bg-[#4267B2] text-white px-4 py-2 rounded-lg hover:bg-opacity-90"
          >
            <Facebook className="h-4 w-4" />
            <span>Facebook</span>
          </a>
          <a
            href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(window.location.href)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-2 bg-[#0077B5] text-white px-4 py-2 rounded-lg hover:bg-opacity-90"
          >
            <Linkedin className="h-4 w-4" />
            <span>LinkedIn</span>
          </a>
          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center space-x-2 bg-gray-600 px-4 py-2 rounded-lg hover:bg-gray-500"
          >
            <Copy className="h-4 w-4" />
            <span>Copy Link</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export const NostrSharePopup: React.FC<{
  content: string;
  onContentChange: (content: string) => void;
  onShare: () => void;
  onClose: () => void;
}> = ({ content, onContentChange, onShare, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Share on Nostr</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          className="w-full bg-gray-700 rounded-lg p-4 mb-4 focus:outline-none focus:ring-2 focus:ring-[#f5a623]"
          rows={4}
        />
        <div className="flex justify-end">
          <button
            onClick={onShare}
            className="flex items-center space-x-2 bg-[#f5a623] text-black px-4 py-2 rounded-lg hover:bg-[#d48c1c]"
          >
            <MessageSquare className="h-4 w-4" />
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareButtons;