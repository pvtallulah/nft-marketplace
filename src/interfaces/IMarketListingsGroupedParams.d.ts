export interface IMarketListingsGroupedParams {
  nftAddress: string;
  limit: string;
  offset: string;
  verifiedCollection: string;
  price: "ASC" | "DESC";
  isIceCollection: string;
  isDecentraland: string;
  name: string;
  sellerAddress: string;
}
