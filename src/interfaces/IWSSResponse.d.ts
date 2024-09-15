export interface IWSSResponse {
  total: number;
  page: number;
  page_size: number;
  cursor: string;
  result?: INftData[] | null;
  status: string;
}
export interface INftDataSafe {
  nftAddress: string;
  tokenId: string;
  price?: number | string;
  from?: string;
}

export interface INftData {
  token_address: string;
  token_id: string;
  block_number_minted?: string;
  owner_of?: string;
  block_number?: string;
  amount?: string;
  contract_type: string;
  collectionName: string;
  symbol: string;
  token_uri: string;
  metadata: string;
  synced_at?: string;
  is_valid?: number;
  syncing?: number;
  frozen?: number;
  price?: number | string;
  priceIce?: string;
  to?: string;
  from?: string;
  timestamp?: Date;
}

export interface ITokenMetadata {
  name?: string;
  description?: string;
  external_url?: string;
  youtube_url?: string;
  image?: string;
  animation_url?: string;
  audio_url?: string;
  media_url?: string;
}

export interface ITokenData {
  token_id: string;
  token_address: string;
  contract_type: string;
  name: string;
  symbol: string;
  token_uri: string;
  metadata: ITokenMetadata;
}
