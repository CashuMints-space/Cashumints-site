import React from 'react';
import { X } from 'lucide-react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';

interface EmojiPickerPopupProps {
  onEmojiClick: (emojiData: EmojiClickData) => void;
  onClose: () => void;
}

const EmojiPickerPopup: React.FC<EmojiPickerPopupProps> = ({ onEmojiClick, onClose }) => {
  return (
    <div className="fixed inset-0 isolate z-[99999]">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Popup content */}
      <div className="fixed inset-0 z-[100000] overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-gray-800 rounded-lg shadow-xl">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute -top-2 -right-2 p-1 rounded-full bg-gray-700 hover:bg-gray-600 z-[100001]"
            >
              <X className="h-4 w-4" />
            </button>
            
            {/* Emoji Picker */}
            <div className="relative">
              <EmojiPicker
                onEmojiClick={onEmojiClick}
                theme={Theme.DARK}
                width={300}
                height={400}
                searchPlaceholder="Search emoji..."
                previewConfig={{ showPreview: false }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmojiPickerPopup;