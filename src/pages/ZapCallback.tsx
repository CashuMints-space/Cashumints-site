import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useNDK } from '../hooks/useNDK';
import { useNotification } from '../context/NotificationContext';
import { NDKEvent } from '@nostr-dev-kit/ndk';
import { log, logError } from '../lib/debug';
import { Loader2 } from 'lucide-react';

const ZapCallback: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { ndk } = useNDK();
  const { showNotification } = useNotification();

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(location.search);
      const eventData = params.get('event');

      if (!eventData || !ndk) {
        showNotification('Invalid callback data', 'error');
        navigate(-1);
        return;
      }

      try {
        // Parse and publish the signed event
        const event = JSON.parse(decodeURIComponent(eventData));
        const ndkEvent = new NDKEvent(ndk, event);
        await ndkEvent.publish();
        
        log.nostr('Zap request published:', event);
        showNotification('Zap sent successfully!', 'success');
        navigate(-1);
      } catch (error) {
        logError(error, 'Processing zap callback');
        showNotification('Failed to send zap', 'error');
        navigate(-1);
      }
    };

    handleCallback();
  }, [location, navigate, ndk, showNotification]);

  return (
    <div className="min-h-screen bg-[#1a1f2e] flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#f5a623] mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-4">Processing zap...</h1>
        <p className="text-gray-400">Please wait while we complete your zap.</p>
      </div>
    </div>
  );
};

export default ZapCallback;