import type { NDKEvent } from '@nostr-dev-kit/ndk';
import type { CashuMint, MintInfo, MintRecommendation, MetaFilters } from '../../types/mint';

export interface MintsContextType {
  mints: CashuMint[];
  loading: boolean;
  error: string | null;
  metaFilters: MetaFilters;
  recommendMint: (mintId: string, content: string, rating: number) => Promise<boolean>;
  refreshMints: () => Promise<void>;
  getMintInfo: (mintId: string) => Promise<MintInfo | null>;
  getProfile: (pubkey: string) => Promise<any>;
}

export interface MintCalculation {
  likes: number;
  dislikes: number;
  rating: number;
}

export interface MintProcessing {
  processRecommendations: (mintId: string, recommendationEvents: Set<NDKEvent>) => Promise<MintRecommendation[]>;
  calculateRating: (recommendations: MintRecommendation[]) => MintCalculation;
  parseMintContent: (content: string) => Partial<MintInfo>;
}