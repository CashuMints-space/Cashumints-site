import { useEffect, useState, useCallback, createContext, useContext } from 'react';
import NDK, { NDKNip07Signer, NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';
import NDKCacheAdapterDexie from '@nostr-dev-kit/ndk-cache-dexie';
import { nip19 } from 'nostr-tools';
import { log, logError } from '../lib/debug';

interface NDKContextType {
  ndk: NDK | null;
  publicKey: string | null;
  login: () => Promise<void>;
  logout: () => void;
  isReady: boolean;
  isMobile: boolean;
  isAmber: boolean;
  signEvent: (event: any) => Promise<any>;
}

const NDKContext = createContext<NDKContextType | undefined>(undefined);

const RELAYS = import.meta.env.VITE_NOSTR_RELAYS?.split(',') || [
  'wss://relay.damus.io',
  'wss://relay.nostr.band',
  'wss://nos.lol',
  'wss://relay.snort.social',
  'wss://nostr.mom'
];

const APP_NAME = import.meta.env.VITE_APP_NAME || 'CashuMints.space';

// Clear existing database to avoid version conflicts
const clearDatabase = async () => {
  try {
    const databases = await window.indexedDB.databases();
    for (const db of databases) {
      if (db.name?.startsWith('ndk-cache-')) {
        await window.indexedDB.deleteDatabase(db.name);
      }
    }
  } catch (error) {
    console.warn('Error clearing databases:', error);
  }
};

export function NDKProvider({ children }: { children: React.ReactNode }) {
  const [ndk, setNDK] = useState<NDK | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isMobile] = useState(() => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
  const [isAmber, setIsAmber] = useState(false);

  const initialize = useCallback(async () => {
    try {
      // Clear existing database to avoid version conflicts
      await clearDatabase();

      // Initialize Dexie cache adapter with a new database
      const dexieAdapter = new NDKCacheAdapterDexie({
        dbName: `ndk-cache-${Date.now()}`, // Unique name to avoid conflicts
        expirationTime: parseInt(import.meta.env.VITE_CACHE_DURATION || '3600', 10),
        eventCacheSize: 1000,
        profileCacheSize: 500,
        debug: log.nostr
      });

      // Check for existing signer
      let signer;
      if (window.nostr) {
        log.nostr('Using NIP-07 extension signer');
        signer = new NDKNip07Signer();
      } else if (window.amber) {
        log.nostr('Using Amber signer');
        setIsAmber(true);
        signer = new NDKNip07Signer();
      }

      const ndkInstance = new NDK({
        explicitRelayUrls: RELAYS,
        debug: log.nostr,
        enableOutboxModel: true,
        cacheAdapter: dexieAdapter,
        signer
      });

      // Handle invalid signatures
      ndkInstance.on('event:invalid-sig', (event) => {
        const { relay } = event;
        log.error('Invalid signature from relay:', relay?.url);
      });

      await ndkInstance.connect();
      log.nostr('NDK connected successfully');
      setNDK(ndkInstance);
      setIsReady(true);

      // Try to restore session
      const savedPubkey = localStorage.getItem('ndk:pubkey');
      if (savedPubkey) {
        log.nostr('Restoring session for pubkey:', savedPubkey);
        setPublicKey(savedPubkey);
      }
    } catch (error) {
      logError(error, 'NDK initialization');
    }
  }, []);

  const signEvent = async (event: any) => {
    if (!ndk) throw new Error('NDK not initialized');

    if (isAmber) {
      // Use Amber's external signer
      const eventJson = encodeURIComponent(JSON.stringify(event));
      const callbackUrl = `${window.location.origin}/review-callback`;
      const signerUrl = `nostrsigner:${eventJson}?compressionType=none&returnType=event&type=sign_event&appName=${APP_NAME}&callbackUrl=${encodeURIComponent(callbackUrl)}`;
      
      // Open Amber signer
      window.location.href = signerUrl;
      return null; // Event will be handled by callback
    } else {
      // Use regular NDK signing
      const ndkEvent = new NDKEvent(ndk, event);
      await ndkEvent.sign();
      return ndkEvent;
    }
  };

  const login = useCallback(async () => {
    if (!ndk) return;

    try {
      log.nostr('Attempting login...');
      
      // Try NIP-07 extension
      if (window.nostr) {
        log.nostr('Using NIP-07 extension');
        const signer = new NDKNip07Signer();
        ndk.signer = signer;
        const user = await signer.user();
        if (user.npub) {
          setPublicKey(user.npub);
          localStorage.setItem('ndk:pubkey', user.npub);
          log.nostr('Login successful with NIP-07 extension');
        }
        return;
      }

      // Try Amber
      if (window.amber) {
        log.nostr('Using Amber');
        setIsAmber(true);
        const callbackUrl = `${window.location.origin}/login-callback`;
        const signerUrl = `nostrsigner:?compressionType=none&returnType=signature&type=get_public_key&appName=${APP_NAME}&callbackUrl=${encodeURIComponent(callbackUrl)}`;
        
        // Open Amber signer
        window.location.href = signerUrl;
        return;
      }

      // Manual nsec input
      const nsec = prompt('Enter your nsec key:');
      if (nsec) {
        try {
          log.nostr('Attempting manual nsec login');
          const { type, data } = nip19.decode(nsec);
          if (type === 'nsec') {
            const signer = new NDKPrivateKeySigner(data as string);
            ndk.signer = signer;
            const user = await signer.user();
            if (user.npub) {
              setPublicKey(user.npub);
              localStorage.setItem('ndk:pubkey', user.npub);
              log.nostr('Login successful with nsec');
            }
          } else {
            throw new Error('Invalid private key format');
          }
        } catch (e) {
          logError(e, 'Manual nsec login');
          throw new Error('Invalid private key format. Please try again.');
        }
      }
    } catch (error) {
      logError(error, 'Login');
      throw error;
    }
  }, [ndk]);

  const logout = useCallback(() => {
    if (ndk) {
      log.nostr('Logging out...');
      ndk.signer = undefined;
    }
    setPublicKey(null);
    setIsAmber(false);
    localStorage.removeItem('ndk:pubkey');
    log.nostr('Logout complete');
  }, [ndk]);

  useEffect(() => {
    initialize();

    return () => {
      if (ndk) {
        log.nostr('Cleaning up NDK...');
        ndk.pool?.close();
      }
    };
  }, [initialize]);

  return (
    <NDKContext.Provider value={{ 
      ndk, 
      publicKey, 
      login, 
      logout, 
      isReady,
      isMobile,
      isAmber,
      signEvent
    }}>
      {children}
    </NDKContext.Provider>
  );
}

export function useNDK() {
  const context = useContext(NDKContext);
  if (context === undefined) {
    throw new Error('useNDK must be used within an NDKProvider');
  }
  return context;
}