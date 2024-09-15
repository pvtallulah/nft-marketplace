import { TransactionReceipt } from "@alch/alchemy-web3";
import { ethers } from "ethers";
import { IFlattenResponse } from "./IMarketplace";
export interface ISaveThirPartyTransactionReq {
  paymentId: string;
  totalPriceFiat: string;
  totalPriceBag: string;
  nftData: IFlattenResponse[];
  conversionRate: string;
  // nftAddress: string;
  // tokenId: string;
  // resourceId: string;
  buyerWallet: string;
  sellerAddress: string;
  status: string;
  type: string;
  email?: string;
}

export interface IThirdPartyTransactionReceipt {
  receipt: TransactionReceipt | ethers.providers.TransactionReceipt;
  status: "sent" | "refund";
}
