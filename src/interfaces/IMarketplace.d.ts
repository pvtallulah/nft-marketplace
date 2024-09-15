export interface IMarketplaceCollections {
  nftAddress: string;
  resourceId: string;
  collectionName: string;
  name: string;
  description: string;
  contractType: string;
  isVerified: boolean;
  images: string[];
  price: number;
  sellerAddress: string;
  iceAmount: number;
  totalSales: number;
}
export interface IMarketplaceCollection {
  marketplaceCollections: IMarketplaceCollections[];
  total: number;
}

export interface IMarketplaceCollections2 {
  nftAddress: string;
  resourceId: string;
  tokenId: string;
  collectionName: string;
  name: string;
  symbol: string;
  description: string;
  contractType: string;
  isVerified: boolean;
  image: string;
  sellerAddress: string;
  price: number;
}

export interface IMarketplaceCollection2 {
  marketplaceCollections: IMarketplaceCollections2[];
  total: number;
}

export interface IMarketListingGroupedRequest {
  nftAddress?: string;
  limit?: string;
  offset?: string;
  price?: string;
  verifiedCollection?: string;
  isDecentraland?: string;
  isIceCollection?: string;
  name?: string;
}

export interface INftDataReq {
  nftAddress: string;
  tokenId: string;
  resourceId?: string;
}

export interface INftBoughtReq {
  nftAddress: string;
  tokenId: string;
  from: string;
  to: string;
}

export interface INftCancelReq {
  nftAddress: string;
  tokenId: string;
}

export interface IFlattenResponse {
  id: number;
  tokenId: string;
  price: number;
  hashDescription: string;
  idDescription: number;
  description: string;
  idResourceGroup: number;
  imageUrl: string;
  idNftAddress: number;
  width: number;
  height: number;
  nftAddress: string;
  collectionName: string;
  name: string;
  symbol: string;
  isWearable: boolean;
  isIceCollection: boolean;
  isDecentraland: boolean;
  active: boolean;
  resourceId: string;
  idAnimation: number;
  animationUrl: string;
  idUri: number;
  uriUrl: string;
  s3Url?: string;
  idYoutube: number;
  youtubeUrl: string;
  idAudio: number;
  audioUrl: string;
  idSeller: number;
  sellerAddress: string;
  isVerifiedCollection: boolean;
  idNftType: number;
  contractType: string;
  totalSales: number;
  iceAmount: number;
}

export interface INextNft {
  resourceId: string;
  tokenId: string;
  nextSellerNft: IFlattenResponse | null;
  nextMarketplaceNft: IFlattenResponse | null;
  newMarketplaceNft: IFlattenResponse | null;
}

export interface IMarketListings {
  marketplaceListings: (IFlattenResponse | null)[];
  total: number;
}

export interface IMarketListingsDict {
  marketplaceListings: {
    [key: string]: IFlattenResponse[] | null;
  };
  total: number;
}

export interface IValidatePublishedNftReq {
  nftAddress: string;
  tokenId: string;
  resourceId: string;
  price?: number;
  sellerAddress?: string;
}

export interface IMarketValidatePublishedNftReq {
  nftAddress: string;
  tokenId: string;
}

export interface IValidatePublishedNftRes {
  isValid: boolean;
  price?: number;
  tokenId?: string;
}
