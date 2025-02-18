export interface Comment {
  id: string;
  pubkey: string;
  content: string;
  createdAt: number;
  replyTo?: string;
  profile?: {
    name?: string;
    displayName?: string;
    image?: string;
  };
}