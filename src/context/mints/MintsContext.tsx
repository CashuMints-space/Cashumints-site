import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchMintInfo } from '../../lib/mint';
import { 
  getCachedItem, 
  setCachedItem, 
  getCachedProfile, 
  setCachedProfile,
  getCachedReviews,
  setCachedReviews,
  getCachedNpub,
  setCachedNpub,
  getCachedMetaFilters,
  setCachedMetaFilters
} from '../../lib/cache';
import type { CashuMint, MintInfo, MintRecommendation, MetaFilters } from '../../types/mint';
import NDK, { NDKEvent, NDKFilter } from '@nostr-dev-kit/ndk';
import { useNDK } from '../../hooks/useNDK';
import { nip19 } from 'nostr-tools';
import { log, logError } from '../../lib/debug';
import { MintsContextType } from './types';
import { calculateRating, parseMintContent } from './utils';

const MintsContext = createContext<MintsContextType | undefined>(undefined);

export const MintsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { ndk, isReady } = useNDK();
  const [mints, setMints] = useState<CashuMint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metaFilters, setMetaFilters] = useState<MetaFilters>({
    networks: new Set(),
    nuts: new Set(),
    versions: new Set(),
    software: new Set(),
    unitsOfAccount: new Set()
  });

  const getProfile = async (pubkey: string) => {
    if (!ndk) return null;

    const cachedProfile = getCachedProfile(pubkey);
    if (cachedProfile) {
      return cachedProfile;
    }

    try {
      const user = await ndk.getUser({ pubkey });
      const profile = await user.fetchProfile();
      if (profile) {
        setCachedProfile(pubkey, profile);
      }
      return profile;
    } catch (error) {
      console.warn('Error fetching profile:', error);
      return null;
    }
  };

  const processRecommendations = useCallback(async (
    mintId: string,
    recommendationEvents: Set<NDKEvent>
  ): Promise<MintRecommendation[]> => {
    const recommendations = await Promise.all(
      Array.from(recommendationEvents)
        .filter(rec => rec.getMatchingTags('a')
          .some(t => t[1].includes(mintId)))
        .map(async rec => {
          const profile = await getProfile(rec.pubkey);
          return {
            id: rec.id,
            pubkey: rec.pubkey,
            content: rec.content,
            createdAt: rec.created_at,
            profile
          };
        })
    );

    // Update cache with new recommendations
    setCachedReviews(mintId, recommendations);
    return recommendations;
  }, [getProfile]);

  const updateMetaFilters = (mint: CashuMint, mintInfo: MintInfo | null) => {
    setMetaFilters(current => {
      const newFilters = { ...current };
      
      // Network
      newFilters.networks.add(mint.network);

      // NUTs
      mint.nuts.forEach(nut => newFilters.nuts.add(nut));

      // Version
      if (mintInfo?.version) {
        const baseVersion = mintInfo.version.split('/')[0];
        newFilters.versions.add(baseVersion);
      }

      // Software
      if (mintInfo?.nuts?.['1']?.software) {
        newFilters.software.add(mintInfo.nuts['1'].software);
      } else if (mintInfo?.version) {
        const baseVersion = mintInfo.version.split('/')[0].toLowerCase();
        if (['nutshell', 'mintd', 'cashu.space'].includes(baseVersion)) {
          newFilters.software.add(baseVersion);
        }
      }

      // Units of Account
      if (mintInfo?.nuts?.['4']?.methods) {
        mintInfo.nuts['4'].methods.forEach((method: any) => {
          if (method.unit) newFilters.unitsOfAccount.add(method.unit);
        });
      }
      mint.nuts.forEach(nut => {
        if (nut.startsWith('4-')) {
          const unit = nut.split('-')[1];
          if (unit) newFilters.unitsOfAccount.add(unit);
        }
      });

      return newFilters;
    });

    // Cache the updated filters
    setCachedMetaFilters(metaFilters);
  };

  const loadMints = async () => {
    if (!ndk || !isReady) return;

    try {
      setLoading(true);
      setError(null);
      
      const cachedMints = getCachedItem<CashuMint[]>('mints');
      if (cachedMints) {
        setMints(cachedMints);
        setLoading(false);
      }

      const mintFilter: NDKFilter = {
        kinds: [38172],
        limit: 100
      };

      const recommendationFilter: NDKFilter = {
        kinds: [38000],
        "#k": ["38172"]
      };

      log.nostr('Fetching mints and recommendations...');
      const [mintEvents, recommendationEvents] = await Promise.all([
        ndk.fetchEvents(mintFilter),
        ndk.fetchEvents(recommendationFilter)
      ]);
      log.nostr('Fetched events:', { 
        mints: mintEvents.size, 
        recommendations: recommendationEvents.size 
      });

      // Create a Map to deduplicate mints by URL
      const mintsMap = new Map<string, CashuMint>();

      await Promise.all(Array.from(mintEvents).map(async event => {
        const url = event.getMatchingTags('u')[0]?.[1] || '';
        if (!url || mintsMap.has(url)) return; // Skip duplicates

        const nuts = event.getMatchingTags('nuts')[0]?.[1]?.split(',') || [];
        const network = event.getMatchingTags('n')[0]?.[1] || import.meta.env.VITE_DEFAULT_NETWORK;
        const mintId = event.getMatchingTags('d')[0]?.[1] || event.id;

        const recommendations = await processRecommendations(mintId, recommendationEvents);
        const parsedContent = parseMintContent(event.content);

        // Calculate likes, dislikes, and rating
        const { likes, dislikes, rating } = calculateRating(recommendations);

        const name = parsedContent.name || url.split('//')[1]?.split('/')[0] || url;
        const description = parsedContent.description || '';

        const mint: CashuMint = {
          id: mintId,
          pubkey: event.pubkey,
          url,
          nuts,
          network,
          name,
          description,
          likes,
          dislikes,
          rating,
          recommendations,
          info: parsedContent as MintInfo
        };

        mintsMap.set(url, mint);
        updateMetaFilters(mint, parsedContent as MintInfo);
      }));

      const processedMints = Array.from(mintsMap.values());
      log.nostr('Processed mints:', processedMints.length);
      setMints(processedMints);
      setCachedItem('mints', processedMints);
    } catch (err) {
      logError(err, 'Loading mints');
      setError('Failed to load mints. Please check your connection and try again.');
      
      const cachedMints = getCachedItem<CashuMint[]>('mints');
      if (cachedMints && !mints.length) {
        setMints(cachedMints);
      }
    } finally {
      setLoading(false);
    }
  };

  const getMintInfo = async (mintId: string): Promise<MintInfo | null> => {
    const mint = mints.find(m => m.id === mintId);
    if (!mint) return null;

    const cacheKey = `mint:${mintId}:info`;
    const cachedInfo = getCachedItem<MintInfo>(cacheKey);
    
    if (cachedInfo) {
      return cachedInfo;
    }

    try {
      const info = await fetchMintInfo(mint.url);
      if (info) {
        setCachedItem(cacheKey, info);
        setMints(current => 
          current.map(m => 
            m.id === mintId ? { ...m, info } : m
          )
        );
        updateMetaFilters(mint, info);
        return info;
      }
    } catch (err) {
      logError(err, 'Fetching mint info');
    }

    return mint.info as MintInfo || null;
  };

  const recommendMint = async (mintId: string, content: string | null, rating: number) => {
    if (!ndk || !isReady) {
      log.error('NDK not ready for recommendation');
      return false;
    }

    const mint = mints.find(m => m.id === mintId);
    if (!mint) {
      log.error('Mint not found for recommendation:', mintId);
      return false;
    }

    try {
      // Format the review content according to NIP-87
      // Ensure the score is only included once
      const reviewContent = `[${rating}/5] ${content ? content.replace(/^\[\d+\/5\]\s*/, '') : ''}`.trim();
      
      log.nostr('Creating recommendation event:', { mintId, content: reviewContent });
      
      const event = {
        kind: 38000,
        content: reviewContent,
        tags: [
          ['k', '38172'],
          ['d', mint.id],
          ['u', mint.url],
          ['a', `38172:${mint.id}`]
        ]
      };

      const ndkEvent = new NDKEvent(ndk, event);
      await ndkEvent.sign();
      log.nostr('Event signed successfully');
      
      await ndkEvent.publish();
      log.nostr('Event published successfully');
      
      await loadMints();
      return true;
    } catch (err) {
      logError(err, 'Recommending mint');
      return false;
    }
  };

  useEffect(() => {
    if (ndk && isReady) {
      loadMints();
      
      // Subscribe to real-time updates for mint info, recommendations, and reactions
      const filter: NDKFilter = {
        kinds: [38172, 38000, 7], // Added kind 7 for reactions
        since: Math.floor(Date.now() / 1000) - 60
      };

      const subscription = ndk.subscribe(
        [filter],
        {
          closeOnEose: false,
          groupable: true,
          groupingDelay: 200,
          groupingDelayType: "at-most"
        },
        undefined,
        {
          onEvent: (event: NDKEvent) => {
            // Handle different event types
            if (event.kind === 38172 || event.kind === 38000) {
              // For mint announcements and recommendations, refresh all mints
              loadMints();
            } else if (event.kind === 7) {
              // For reactions, only update the specific mint
              const mintId = event.getMatchingTags('a')?.[0]?.[1]?.split(':')?.[1];
              if (mintId) {
                setMints(current => {
                  const mintIndex = current.findIndex(m => m.id === mintId);
                  if (mintIndex === -1) return current;

                  // Clone the mint and update its reactions
                  const updatedMint = { ...current[mintIndex] };
                  const { likes, dislikes, rating } = calculateRating(updatedMint.recommendations);
                  updatedMint.likes = likes;
                  updatedMint.dislikes = dislikes;
                  updatedMint.rating = rating;

                  // Create new array with updated mint
                  const newMints = [...current];
                  newMints[mintIndex] = updatedMint;
                  return newMints;
                });
              }
            }
          },
          onEose: () => log.nostr('EOSE received for mint subscription')
        }
      );

      return () => {
        subscription.stop();
      };
    }
  }, [ndk, isReady]);

  return (
    <MintsContext.Provider 
      value={{ 
        mints, 
        loading, 
        error, 
        metaFilters,
        recommendMint,
        refreshMints: loadMints,
        getMintInfo,
        getProfile
      }}
    >
      {children}
    </MintsContext.Provider>
  );
};

export const useMints = () => {
  const context = useContext(MintsContext);
  if (context === undefined) {
    throw new Error('useMints must be used within a MintsProvider');
  }
  return context;
};