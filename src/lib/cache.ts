import { MintRecommendation, MetaFilters } from '../types/mint';

const CACHE_PREFIX = 'cashumints:';
const CACHE_DURATION = parseInt(import.meta.env.VITE_CACHE_DURATION || '3600000', 10); // Default 1 hour
const PROFILE_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours for profiles
const REVIEWS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes for reviews
const META_FILTERS_CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours for meta filters

interface CacheItem<T> {
  value: T;
  timestamp: number;
}

export function getCachedItem<T>(key: string, customDuration?: number): T | null {
  const item = localStorage.getItem(`${CACHE_PREFIX}${key}`);
  if (!item) return null;

  try {
    const { value, timestamp } = JSON.parse(item) as CacheItem<T>;
    const duration = customDuration || CACHE_DURATION;
    if (Date.now() - timestamp > duration) {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

export function setCachedItem<T>(key: string, value: T): void {
  localStorage.setItem(
    `${CACHE_PREFIX}${key}`,
    JSON.stringify({
      value,
      timestamp: Date.now()
    })
  );
}

// Profile caching
interface UserProfile {
  name?: string;
  displayName?: string;
  image?: string;
  nip05?: string;
  about?: string;
}

export function getCachedProfile(pubkey: string): UserProfile | null {
  return getCachedItem<UserProfile>(`profile:${pubkey}`, PROFILE_CACHE_DURATION);
}

export function setCachedProfile(pubkey: string, profile: UserProfile): void {
  setCachedItem(`profile:${pubkey}`, profile);
}

// Reviews caching
export function getCachedReviews(mintId: string): MintRecommendation[] | null {
  return getCachedItem<MintRecommendation[]>(`reviews:${mintId}`, REVIEWS_CACHE_DURATION);
}

export function setCachedReviews(mintId: string, reviews: MintRecommendation[]): void {
  setCachedItem(`reviews:${mintId}`, reviews);
}

// Npub caching
export function getCachedNpub(pubkey: string): string | null {
  return getCachedItem<string>(`npub:${pubkey}`, PROFILE_CACHE_DURATION);
}

export function setCachedNpub(pubkey: string, npub: string): void {
  setCachedItem(`npub:${pubkey}`, npub);
}

// Meta filters caching
export function getCachedMetaFilters(): MetaFilters | null {
  return getCachedItem<MetaFilters>('meta-filters', META_FILTERS_CACHE_DURATION);
}

export function setCachedMetaFilters(filters: MetaFilters): void {
  setCachedItem('meta-filters', filters);
}