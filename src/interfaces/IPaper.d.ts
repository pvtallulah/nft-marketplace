export interface IPaperWebhook {
  event:
    | "payment:succeeded"
    | "payment:failed"
    | "transfer:succeeded"
    | "transfer:failed";
  result: IResult;
}

export interface IResult {
  id: string;
  checkoutId: string;
  walletAddress: string;
  walletType: string;
  email: string;
  quantity: number;
  paymentMethod: string;
  networkFeeUsd: number;
  serviceFeeUsd: number;
  totalPriceUsd: number;
  createdAt: Date;
  paymentCompletedAt: Date;
  transferCompletedAt: Date;
  claimedTokens: IClaimedTokens;
  title: string;
}

export interface IClaimedTokens {
  tokenIds: string[];
  transactionHashes: ITransactionHashes;
}

export interface ITransactionHashes {
  [key: string]: { tokenIds: string[] };
}

export interface IPaperPaymentLink {
  checkoutLinkIntentUrl: string;
}
