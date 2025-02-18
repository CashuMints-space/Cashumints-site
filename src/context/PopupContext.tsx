import React, { createContext, useContext, useState } from 'react';
import EmojiPickerPopup from '../components/popups/EmojiPickerPopup';
import ZapPopup from '../components/popups/ZapPopup';
import type { EmojiClickData } from 'emoji-picker-react';

interface PopupContextType {
  showEmojiPicker: (onSelect: (emoji: EmojiClickData) => void) => void;
  showZapPopup: (pubkey: string, eventId?: string, defaultAmount?: number) => void;
  hidePopups: () => void;
}

const PopupContext = createContext<PopupContextType | undefined>(undefined);

export function PopupProvider({ children }: { children: React.ReactNode }) {
  const [showEmoji, setShowEmoji] = useState(false);
  const [showZap, setShowZap] = useState(false);
  const [emojiCallback, setEmojiCallback] = useState<((emoji: EmojiClickData) => void) | null>(null);
  const [zapDetails, setZapDetails] = useState<{
    pubkey: string;
    eventId?: string;
    defaultAmount?: number;
  } | null>(null);

  const showEmojiPicker = (onSelect: (emoji: EmojiClickData) => void) => {
    setEmojiCallback(() => onSelect);
    setShowEmoji(true);
  };

  const showZapPopup = (pubkey: string, eventId?: string, defaultAmount?: number) => {
    setZapDetails({ pubkey, eventId, defaultAmount });
    setShowZap(true);
  };

  const hidePopups = () => {
    setShowEmoji(false);
    setShowZap(false);
    setEmojiCallback(null);
    setZapDetails(null);
  };

  return (
    <PopupContext.Provider value={{ showEmojiPicker, showZapPopup, hidePopups }}>
      {children}

      {/* Emoji Picker Popup */}
      {showEmoji && emojiCallback && (
        <EmojiPickerPopup
          onEmojiClick={(emoji) => {
            emojiCallback(emoji);
            hidePopups();
          }}
          onClose={hidePopups}
        />
      )}

      {/* Zap Popup */}
      {showZap && zapDetails && (
        <ZapPopup
          pubkey={zapDetails.pubkey}
          eventId={zapDetails.eventId}
          defaultAmount={zapDetails.defaultAmount || 21}
          onClose={hidePopups}
        />
      )}
    </PopupContext.Provider>
  );
}

export function usePopups() {
  const context = useContext(PopupContext);
  if (!context) {
    throw new Error('usePopups must be used within a PopupProvider');
  }
  return context;
}