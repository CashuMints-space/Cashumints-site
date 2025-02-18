import { z } from 'zod';

// Define schema for NUT method details
const NutMethodDetailSchema = z.object({
  method: z.string(),
  unit: z.string().optional(),
  min_amount: z.number().optional(),
  max_amount: z.number().optional(),
  description: z.boolean().optional(),
  commands: z.array(z.string()).optional()
}).passthrough();

// Define schema for NUT methods array
const NutMethodsSchema = z.array(NutMethodDetailSchema).optional();

// Define schema for NUT configuration
const NutConfigSchema = z.object({
  methods: z.union([
    NutMethodsSchema,
    z.array(z.string())
  ]).optional(),
  disabled: z.boolean().optional(),
  supported: z.union([
    z.boolean(),
    z.array(NutMethodDetailSchema)
  ]).optional(),
  software: z.string().optional(),
  unit: z.string().optional(),
  cached_endpoints: z.array(z.object({
    method: z.string(),
    path: z.string()
  })).optional(),
  ttl: z.number().optional()
}).passthrough();

// Define the nuts object schema
const NutsSchema = z.record(z.string(), NutConfigSchema).optional();

// Update the contact schema to handle both object and array formats
const ContactSchema = z.union([
  z.object({
    method: z.string(),
    info: z.string()
  }),
  z.tuple([z.string(), z.string()])
]);

export const MintInfoSchema = z.object({
  name: z.string().optional(),
  pubkey: z.string().optional(),
  version: z.string().optional(),
  description: z.string().optional(),
  description_long: z.string().optional(),
  contact: z.array(ContactSchema).optional(),
  motd: z.string().optional(),
  icon_url: z.string().url().optional(),
  urls: z.array(z.string().url()).optional(),
  time: z.number().optional(),
  nuts: NutsSchema
}).passthrough();

export type MintInfo = z.infer<typeof MintInfoSchema>;

export interface CashuMint {
  id: string;
  pubkey: string;
  url: string;
  nuts: string[];
  network: string;
  name: string;
  description: string;
  likes: number;
  dislikes: number;
  rating: number;
  recommendations: MintRecommendation[];
  info?: MintInfo;
  lastFetched?: number;
}

export interface MintRecommendation {
  id: string;
  pubkey: string;
  content: string;
  createdAt: number;
  profile?: {
    name?: string;
    displayName?: string;
    image?: string;
    nip05?: string;
    about?: string;
  };
}

export interface MintAnnouncement {
  id: string;
  pubkey: string;
  content: string;
  tags: string[][];
  created_at: number;
}

export interface MetaFilters {
  networks: Set<string>;
  nuts: Set<string>;
  versions: Set<string>;
  software: Set<string>;
  unitsOfAccount: Set<string>;
}