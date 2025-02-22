import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { fetchMintInfo } from '../lib/mint';
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
} from '../lib/cache';
import type { CashuMint, MintInfo, MintRecommendation, MetaFilters } from '../types/mint';
import NDK, { NDKEvent, NDKFilter } from '@nostr-dev-kit/ndk';
import { useNDK } from '../hooks/useNDK';
import { nip19 } from 'nostr-tools';
import { log, logError } from '../lib/debug';
import { calculateRating, parseMintContent } from './mints/utils';

const METADATA_FETCH_INTERVAL = 5000; // 5 seconds between each mint metadata fetch
const METADATA_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const REVIEW_FETCH_INTERVAL = 10000; // 10 seconds between review fetches

interface MintsContextType {
  mints: CashuMint[];
  loading: boolean;
  error: string | null;
  metaFilters: MetaFilters;
  recommendMint: (mintId: string, content: string, rating: number) => Promise<boolean>;
  refreshMints: () => Promise<void>;
  getMintInfo: (mintId: string) => Promise<MintInfo | null>;
  getProfile: (pubkey: string) => Promise<any>;
}

const MintsContext = createContext<MintsContextType | undefined>(undefined);

export function MintsProvider({ children }: { children: React.ReactNode }) {
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

  // Use refs to track metadata fetching state
  const metadataQueue = useRef<string[]>([]);
  const isFetchingMetadata = useRef(false);
  const abortController = useRef<AbortController | null>(null);
  const shouldFetchMetadata = useRef(false);
  const isInitialMount = useRef(true);

  const getProfile = useCallback(async (pubkey: string) => {
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
  }, [ndk]);

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

    setCachedReviews(mintId, recommendations);
    return recommendations;
  }, [getProfile]);

  const updateMetaFilters = useCallback((mint: CashuMint, mintInfo: MintInfo | null) => {
    setMetaFilters(current => {
      const newFilters = { ...current };
      
      newFilters.networks.add(mint.network);
      mint.nuts.forEach(nut => newFilters.nuts.add(nut));

      if (mintInfo?.version) {
        const baseVersion = mintInfo.version.split('/')[0];
        newFilters.versions.add(baseVersion);
      }

      if (mintInfo?.nuts?.['1']?.software) {
        newFilters.software.add(mintInfo.nuts['1'].software);
      } else if (mintInfo?.version) {
        const baseVersion = mintInfo.version.split('/')[0].toLowerCase();
        if (['nutshell', 'mintd', 'cashu.space'].includes(baseVersion)) {
          newFilters.software.add(baseVersion);
        }
      }

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

    setCachedMetaFilters(metaFilters);
  }, []);

  const fetchMintMetadata = useCallback(async () => {
    if (isFetchingMetadata.current || metadataQueue.current.length === 0) return;

    isFetchingMetadata.current = true;
    const mintId = metadataQueue.current.shift();

    if (!mintId) {
      isFetchingMetadata.current = false;
      return;
    }

    try {
      const mint = mints.find(m => m.id === mintId);
      if (!mint) {
        isFetchingMetadata.current = false;
        return;
      }

      // Check if metadata is already cached and not expired
      const cacheKey = `mint:${mintId}:info`;
      const cachedInfo = getCachedItem<MintInfo & { timestamp: number }>(cacheKey);
      if (cachedInfo && Date.now() - cachedInfo.timestamp < METADATA_CACHE_DURATION) {
        isFetchingMetadata.current = false;
        return;
      }

      // Create new abort controller for this fetch
      abortController.current = new AbortController();

      log.mint(`Fetching metadata for mint ${mint.name} (${mint.url})`);
      const info = await fetchMintInfo(mint.url);
      
      if (info) {
        // Cache the metadata with timestamp
        setCachedItem(cacheKey, { ...info, timestamp: Date.now() });
        
        // Update mint in state
        setMints(current => 
          current.map(m => 
            m.id === mintId ? { 
              ...m, 
              info,
              name: info.name || m.name,
              description: info.description || m.description,
              lastFetched: Date.now()
            } : m
          )
        );

        // Update meta filters
        updateMetaFilters(mint, info);
        
        log.mint(`Updated metadata for mint ${mint.name}`);
      }
    } catch (error) {
      logError(error, `Fetching metadata for mint ${mintId}`);
    } finally {
      isFetchingMetadata.current = false;
      abortController.current = null;

      // Schedule next metadata fetch if we should continue
      if (shouldFetchMetadata.current) {
        setTimeout(fetchMintMetadata, METADATA_FETCH_INTERVAL);
      }
    }
  }, [mints, updateMetaFilters]);

  const loadMints = useCallback(async () => {
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
        if (!url || mintsMap.has(url)) return;

        const nuts = event.getMatchingTags('nuts')[0]?.[1]?.split(',') || [];
        const network = event.getMatchingTags('n')[0]?.[1] || import.meta.env.VITE_DEFAULT_NETWORK;
        const mintId = event.getMatchingTags('d')[0]?.[1] || event.id;

        const recommendations = await processRecommendations(mintId, recommendationEvents);
        const parsedContent = parseMintContent(event.content);

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
          info: parsedContent as MintInfo,
          lastFetched: Date.now()
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
  }, [ndk, isReady, processRecommendations, updateMetaFilters]);

  const getMintInfo = useCallback(async (mintId: string): Promise<MintInfo | null> => {
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
            m.id === mintId ? { ...m, info, lastFetched: Date.now() } : m
          )
        );
        updateMetaFilters(mint, info);
        return info;
      }
    } catch (err) {
      logError(err, 'Fetching mint info');
    }

    return mint.info as MintInfo || null;
  }, [mints, updateMetaFilters]);

  const recommendMint = useCallback(async (mintId: string, content: string, rating: number) => {
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
      const reviewContent = `[${rating}/5]${content.trim() ? ` ${content.trim()}` : ''}`;
      
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
  }, [ndk, isReady, mints, loadMints]);

  // Start metadata fetching when mints are loaded
  useEffect(() => {
    if (!isInitialMount.current && mints.length > 0) {
      // Reset and populate metadata queue
      metadataQueue.current = mints
        .filter(mint => !mint.info || !mint.lastFetched || Date.now() - mint.lastFetched > METADATA_CACHE_DURATION)
        .map(mint => mint.id);

      // Start fetching if not already running
      if (!isFetchingMetadata.current && shouldFetchMetadata.current) {
        fetchMintMetadata();
      }
    }

    isInitialMount.current = false;

    return () => {
      // Cleanup on unmount
      if (abortController.current) {
        abortController.current.abort();
      }
    };
  }, [mints, fetchMintMetadata]);

  // Control metadata fetching based on route
  useEffect(() => {
    const handleRouteChange = () => {
      const path = window.location.pathname;
      shouldFetchMetadata.current = path === '/' || path === '/all-mints';
    };

    // Set initial value
    handleRouteChange();

    // Listen for route changes
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    if (ndk && isReady) {
      loadMints();
      
      const filter: NDKFilter = {
        kinds: [38172, 38000, 7],
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
            if (event.kind === 38172 || event.kind === 38000) {
              loadMints();
            } else if (event.kind === 7) {
              const mintId = event.getMatchingTags('a')?.[0]?.[1]?.split(':')?.[1];
              if (mintId) {
                setMints(current => {
                  const mintIndex = current.findIndex(m => m.id === mintId);
                  if (mintIndex === -1) return current;

                  const updatedMint = { ...current[mintIndex] };
                  const { likes, dislikes, rating } = calculateRating(updatedMint.recommendations);
                  updatedMint.likes = likes;
                  updatedMint.dislikes = dislikes;
                  updatedMint.rating = rating;

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
        if (abortController.current) {
          abortController.current.abort();
        }
      };
    }
  }, [ndk, isReady, loadMints]);

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
}

export function useMints() {
  const context = useContext(MintsContext);
  if (context === undefined) {
    throw new Error('useMints must be used within a MintsProvider');
  }
  return context;
}