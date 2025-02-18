import NDK, { NDKEvent, NDKFilter, NDKRelay, NDKSubscription } from '@nostr-dev-kit/ndk';
import NDKCacheAdapterDexie from '@nostr-dev-kit/ndk-cache-dexie';

const RELAYS = import.meta.env.VITE_NOSTR_RELAYS?.split(',') || [
  'wss://relay.primal.net',
  'wss://relay.satoshidnc.com',
  'wss://relay.snort.social',
  'wss://relay.damus.io'
];

// Enable NDK debugging in development
if (import.meta.env.DEV) {
  localStorage.debug = 'ndk:*';
}

// Create a singleton NDK instance
let ndk: NDK | null = null;

function getNDK() {
  if (!ndk) {
    // Initialize Dexie cache adapter
    const dexieAdapter = new NDKCacheAdapterDexie({
      dbName: 'cashumints-cache',
      expirationTime: parseInt(import.meta.env.VITE_CACHE_DURATION || '3600', 10),
      eventCacheSize: 1000,
      profileCacheSize: 500,
      debug: import.meta.env.DEV
    });

    ndk = new NDK({
      explicitRelayUrls: RELAYS,
      debug: true,
      enableOutboxModel: true,
      cacheAdapter: dexieAdapter,
      // Optimize signature verification
      initialValidationRatio: 0.5,
      lowestValidationRatio: 0.1
    });

    // Handle invalid signatures
    ndk.on('event:invalid-sig', (event) => {
      const { relay } = event;
      console.error('Invalid signature from relay:', relay?.url);
    });
  }
  return ndk;
}

// Network debugging helper
const netDebug = (msg: string, relay: NDKRelay, direction?: "send" | "recv") => {
  const hostname = new URL(relay.url).hostname;
  console.debug(`[${hostname}] ${direction ? direction + ': ' : ''}${msg}`);
};

export async function connect() {
  const instance = getNDK();
  if (!instance.pool?.connectedRelays.length) {
    await instance.connect();
  }
  return instance;
}

export async function fetchMints() {
  try {
    const instance = await connect();

    // Create filters for mint announcements and recommendations
    const mintFilter: NDKFilter = {
      kinds: [38172],
      limit: 100
    };

    const recommendationFilter: NDKFilter = {
      kinds: [38000],
      "#k": ["38172"],
      limit: 100
    };

    // Fetch events with subscription grouping
    const [mintEvents, recommendationEvents] = await Promise.all([
      instance.fetchEvents(mintFilter, { 
        groupable: true,
        groupingDelay: 100
      }),
      instance.fetchEvents(recommendationFilter, {
        groupable: true,
        groupingDelay: 100
      })
    ]);

    // Convert Set to Array and process mint announcements
    const mints = Array.from(mintEvents).map(event => {
      const url = event.getMatchingTags('u')[0]?.[1] || '';
      const nuts = event.getMatchingTags('nuts')[0]?.[1]?.split(',') || [];
      const network = event.getMatchingTags('n')[0]?.[1] || import.meta.env.VITE_DEFAULT_NETWORK;
      const mintId = event.getMatchingTags('d')[0]?.[1] || event.id;

      // Get recommendations for this mint
      const mintRecommendations = Array.from(recommendationEvents)
        .filter(rec => rec.getMatchingTags('a')
          .some(t => t[1].includes(mintId)));

      // Calculate likes and dislikes
      const likes = mintRecommendations
        .filter(r => !r.content.toLowerCase().includes('not recommended')).length;
      const dislikes = mintRecommendations
        .filter(r => r.content.toLowerCase().includes('not recommended')).length;

      // Calculate rating
      const total = likes + dislikes;
      const rating = total > 0 ? Math.max(1, Math.round((likes / total) * 5)) : 0;

      return {
        id: mintId,
        pubkey: event.pubkey,
        url,
        nuts,
        network,
        name: url.split('//')[1]?.split('/')[0] || url,
        description: event.content || '',
        likes,
        dislikes,
        rating,
        recommendations: mintRecommendations.map(rec => ({
          id: rec.id,
          pubkey: rec.pubkey,
          content: rec.content,
          createdAt: rec.created_at
        }))
      };
    });

    return mints;
  } catch (error) {
    console.error('Error fetching mints:', error);
    throw error;
  }
}

export async function publishMintAnnouncement(
  url: string,
  description: string,
  nuts: string[],
  network: string
) {
  try {
    const instance = await connect();
    
    const event = new NDKEvent(instance, {
      kind: 38172,
      content: description,
      tags: [
        ['u', url],
        ['nuts', nuts.join(',')],
        ['n', network]
      ]
    });

    await event.publish();
    return true;
  } catch (error) {
    console.error('Error publishing mint announcement:', error);
    throw error;
  }
}

export async function publishMintRecommendation(
  mint: { id: string; url: string },
  content: string
) {
  try {
    const instance = await connect();
    
    const event = new NDKEvent(instance, {
      kind: 38000,
      content,
      tags: [
        ['k', '38172'],
        ['d', mint.id],
        ['u', mint.url],
        ['a', `38172:${mint.id}`]
      ]
    });

    await event.publish();
    return true;
  } catch (error) {
    console.error('Error publishing recommendation:', error);
    throw error;
  }
}

// Subscribe to real-time mint updates with intelligent grouping
export function subscribeToMints(onEvent: (event: NDKEvent) => void): NDKSubscription {
  const instance = getNDK();
  
  const filter: NDKFilter = {
    kinds: [38172, 38000],
    since: Math.floor(Date.now() / 1000) - 60 // Last minute only
  };

  return instance.subscribe(
    [filter],
    {
      closeOnEose: false,
      groupable: true,
      groupingDelay: 200,
      groupingDelayType: "at-most"
    },
    undefined,
    {
      onEvent,
      onEose: () => console.debug('EOSE received for mint subscription')
    }
  );
}

// Cleanup function
export function cleanup() {
  if (ndk) {
    ndk.pool?.close();
    ndk = null;
  }
}