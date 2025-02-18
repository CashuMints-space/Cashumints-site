import React, { createContext, useContext, useState, useCallback } from 'react';
import { getPublicKey } from 'nostr-tools';

interface NostrContextType {
  publicKey: string | null;
  login: () => Promise<void>;
  logout: () => void;
}

const NostrContext = createContext<NostrContextType | undefined>(undefined);

export const NostrProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [publicKey, setPublicKey] = useState<string | null>(null);

  const login = useCallback(async () => {
    try {
      // Try NIP-07 extension
      if (window.nostr) {
        const pubkey = await window.nostr.getPublicKey();
        setPublicKey(pubkey);
        return;
      }

      // Try Amber
      if (window.amber) {
        const pubkey = await window.amber.getPublicKey();
        setPublicKey(pubkey);
        return;
      }

      // Manual nsec input
      const nsec = prompt('Enter your nsec key:');
      if (nsec) {
        const pubkey = getPublicKey(nsec);
        setPublicKey(pubkey);
      }
    } catch (error) {
      console.error('Login failed:', error);
      alert('Failed to login. Please try again.');
    }
  }, []);

  const logout = useCallback(() => {
    setPublicKey(null);
  }, []);

  return (
    <NostrContext.Provider value={{ publicKey, login, logout }}>
      {children}
    </NostrContext.Provider>
  );
};

export const useNostr = () => {
  const context = useContext(NostrContext);
  if (context === undefined) {
    throw new Error('useNostr must be used within a NostrProvider');
  }
  return context;
};