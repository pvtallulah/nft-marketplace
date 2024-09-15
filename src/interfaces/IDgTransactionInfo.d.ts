export interface IDgTransactionInfo {
  type: string;
  nftAddress: string;
  tokenId: string;
  to: string;
  from: string;
  timestamp: Date;
  price?: string;
}
