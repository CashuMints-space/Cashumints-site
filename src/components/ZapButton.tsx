import React from 'react';
import { Zap } from 'lucide-react';
import { useNDK } from '@/hooks/useNDK';
import { useNotification } from '@/context/NotificationContext';
import { useSettings } from '@/hooks/useSettings';
import { usePopups } from '@/context/PopupContext';
import { init } from '@getalby/bitcoin-connect-react';

// Initialize Bitcoin Connect
init({
  appName: import.meta.env.VITE_APP_NAME || 'CashuMints.space',
  showBalance: false,
  providerConfig: {
    nwc: {
      authorizationUrlOptions: {
        requestMethods: ['make_invoice', 'pay_invoice'],
      },
    },
  },
});

interface ZapButtonProps {
  pubkey: string;
  eventId?: string;
  small?: boolean;
}

const ZapButton: React.FC<ZapButtonProps> = ({ pubkey, eventId, small = false }) => {
  const { publicKey } = useNDK();
  const { showNotification } = useNotification();
  const { settings } = useSettings();
  const { showZapPopup } = usePopups();

  const handleClick = () => {
    if (!publicKey) {
      showNotification('Please login to zap', 'error');
      return;
    }
    showZapPopup(pubkey, eventId, settings.defaultZapAmount);
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center space-x-1 ${
        small 
          ? 'px-2 py-1 text-sm rounded-md' 
          : 'px-3 py-2 rounded-lg'
      } bg-[#f5a623] text-black hover:bg-[#d48c1c] transition-colors`}
    >
      <Zap className={small ? 'h-3 w-3' : 'h-4 w-4'} />
      <span>Zap</span>
    </button>
  );
};

export default ZapButton;