export interface ITransactionReceiptData {
  type: string;
  from?: string;
  to?: string;
  data: {
    nftAddress: string;
    hTokenId: string;
    hPrice?: string;
  };
}
