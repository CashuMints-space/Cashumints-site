import type { MintInfo, MintRecommendation } from '../../types/mint';
import type { MintCalculation } from './types';

export function calculateRating(recommendations: MintRecommendation[]): MintCalculation {
  // Get all valid ratings
  const ratings = recommendations
    .map(rec => {
      const ratingMatch = rec.content.match(/^\[(\d+)\/5\]/);
      return ratingMatch ? parseInt(ratingMatch[1], 10) : null;
    })
    .filter((rating): rating is number => rating !== null);

  if (ratings.length === 0) {
    return { likes: 0, dislikes: 0, rating: 0 };
  }

  // Check if all ratings are 5 stars first
  if (ratings.every(r => r === 5)) {
    return {
      likes: ratings.length,
      dislikes: 0,
      rating: 5
    };
  }

  // Calculate average rating
  const averageRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  
  // Round to nearest 0.5
  const rating = Math.round(averageRating * 2) / 2;

  // Count likes (ratings >= 3) and dislikes (ratings < 3)
  const likes = ratings.filter(r => r >= 3).length;
  const dislikes = ratings.filter(r => r < 3).length;

  return { likes, dislikes, rating };
}

export function parseMintContent(content: string): Partial<MintInfo> {
  try {
    if (typeof content === 'string' && content.trim().startsWith('{')) {
      const parsed = JSON.parse(content);
      return {
        name: parsed.name,
        description: parsed.description,
        version: parsed.version,
        nuts: parsed.nuts || {},
        contact: Array.isArray(parsed.contact) ? parsed.contact.map(c => 
          Array.isArray(c) ? { method: c[0], info: c[1] } : c
        ).filter(c => c.info) : [],
        motd: parsed.motd
      };
    }
    return { description: content };
  } catch (error) {
    console.warn('Error parsing mint content:', error);
    return { description: content };
  }
}