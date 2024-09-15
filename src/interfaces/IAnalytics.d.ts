export interface IAnalyticsNftAddress {
  nftAddress: string;
}
export interface IAnalyticsNftAddressTokenId {
  nftAddress: string;
  tokenId: string;
}

export interface IAnalyticsDates {
  from?: string;
  to?: string;
}

export interface IAnalyticsSellerAddress {
  sellerAddress: string;
}

export interface IAnalyticsDatesWallet extends IAnalyticsDates {
  walletAddress: string;
}
export interface IRevenuePerDay {
  date: Date;
  sales: number;
}
export interface INftSoldPerDay {
  date: Date;
  sales: number;
}

export interface IWalletTotalRevenue {
  totalRevenue: number;
}

export interface IWalletTotalNftSold {
  sales: number;
}

export interface ISoldRanking {
  nftAddress: string;
  name: string;
  revenue: number;
  amount: number;
}

export interface IRecentSales {
  name: string;
  price: number;
  nftAddress: string;
  date: Date;
}

export interface IMarketplaceTotalSales {
  sales: number;
}

export interface IMarketplaceTotalNftSold {
  sales: number;
}

export interface IAnalyticsActivity {
  createdAt: Date;
  date: Date;
  fromWallet: string;
  price: number;
  toWallet: string;
  type: string;
}
export interface ITradeVolume {
  volme: number;
}
export interface IMarketplaceGeneralActivity extends IAnalyticsActivity {
  name: string;
  nftAddress: string;
}

export interface ITokenActivity extends IAnalyticsActivity {
  transactionHash: string;
}

export interface IRecentActivity extends IAnalyticsActivity {
  transactionHash: string;
  status: string;
}

export interface IWalletNftSoldRanking extends ISoldRanking {}

export interface IWalletRevenuePerDay extends IRevenuePerDay {}

export interface IWalletNftSoldPerDay extends INftSoldPerDay {}

export interface IWalletRecentSales extends IRecentSales {}

export interface IMarketplaceSalesPerDay extends IRevenuePerDay {}

export interface IMarketplaceNftSoldPerDay extends INftSoldPerDay {}

export interface IMarketplaceNftSoldRanking extends ISoldRanking {}

export interface IMarketplaceRecentSales extends IRecentSales {}
