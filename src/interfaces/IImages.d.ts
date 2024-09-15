interface INftImageData {
  nftAddress: string;
  tokenId: string;
  width: number;
  height: number;
}

export interface IImagesDimensionsRequest {
  images: {
    nftAddress: string;
    tokenId: string;
  }[];
}

export interface IImagesDimensionsResponse {
  imagesDimensions: INftImageData[];
}
