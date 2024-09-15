export interface CollectionTokenMetadata {
  name: string;
  description: string;
  image: string;
  attributes: any[];
  animation_url?: string;
  external_url?: string;
  youtube_url?: string;
  thumbnail?: string;
}

export interface CollectionMetadata {
  contractAddress: string;
  tokens: number[];
  metadata: CollectionTokenMetadata;
}

export interface TokensMetadataEntry {
  tokens: number[];
  metadata: CollectionTokenMetadata;
  hash: string;
}
