import { useState, useEffect } from 'react';
import { log } from '@/lib/debug';

interface Settings {
  defaultZapAmount: number;
  nwcUrl?: string;
  nwcPubkey?: string;
  nwcRelay?: string;
  nwcSecret?: string;
}

const defaultSettings: Settings = {
  defaultZapAmount: 21
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('settings');
    return saved ? JSON.parse(saved) : defaultSettings;
  });

  useEffect(() => {
    localStorage.setItem('settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(current => ({
      ...current,
      ...newSettings
    }));
  };

  const updateNWC = (nwcUrl: string) => {
    try {
      if (!nwcUrl.trim()) {
        return false;
      }

      // Handle both nostr+walletconnect:// and nostr+walletconnect: formats
      const cleanUrl = nwcUrl.replace(/^nostr\+walletconnect:\/\//, 'nostr+walletconnect:');
      
      // Parse the URL
      const url = new URL(cleanUrl);
      
      // Validate protocol
      if (url.protocol !== 'nostr+walletconnect:') {
        log.error('Invalid NWC protocol:', url.protocol);
        return false;
      }

      // Extract pubkey from pathname (remove leading slash if present)
      const pubkey = url.pathname.replace(/^\//, '');
      
      // Get relay and secret from search params
      const params = new URLSearchParams(url.search);
      const relay = params.get('relay');
      const secret = params.get('secret');

      // Validate required parameters
      if (!pubkey || !relay || !secret) {
        log.error('Missing required NWC parameters:', { pubkey, relay, secret });
        return false;
      }

      // Validate relay URL format
      try {
        const relayUrl = new URL(relay);
        if (!['ws:', 'wss:'].includes(relayUrl.protocol)) {
          log.error('Invalid relay protocol:', relayUrl.protocol);
          return false;
        }
      } catch (e) {
        log.error('Invalid relay URL:', relay);
        return false;
      }

      // Update settings
      updateSettings({
        nwcUrl: cleanUrl,
        nwcPubkey: pubkey,
        nwcRelay: relay,
        nwcSecret: secret
      });

      return true;
    } catch (error) {
      log.error('Invalid NWC URL:', error);
      return false;
    }
  };

  const clearNWC = () => {
    updateSettings({
      nwcUrl: undefined,
      nwcPubkey: undefined,
      nwcRelay: undefined,
      nwcSecret: undefined
    });
  };

  return {
    settings,
    updateSettings,
    updateNWC,
    clearNWC
  };
}