export interface ITransactionLog {
  id: number;
  transactionHash: string;
  blockNumber: number;
  type: string;
  status?: string;
  timestamp: Date;
  tokenId?: string;
  to?: string;
  from?: string;
  recipient?: string;
  price?: string;
  nftAddress?: string;
  isValidated?: boolean;
}
