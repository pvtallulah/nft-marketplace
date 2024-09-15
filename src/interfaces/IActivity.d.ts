export interface WalletActivity {
  id: number;
  transactionHash: string;
  blockNumber: number;
  tokenId: string;
  price: string;
  isValidated: boolean;
  createdAt: Date;
  nftAddress: string;
  from: string;
  to: string;
  type: string;
}

export interface WalletActivityResponse {
  walletActivity: WalletActivity[];
  total: number;
}
