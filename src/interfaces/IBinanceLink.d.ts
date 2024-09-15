export interface IBinanceLink {
  prepayId: string;
  terminalType: string;
  expireTime: number;
  qrcodeLink: string;
  qrContent: string;
  checkoutUrl: string;
  deeplink: string;
  universalUrl: string;
  email?: string;
}

export interface IBinanceQueryOrder {
  status: string;
  code: string;
  data: IBinanceQueryOrderResponse;
  errorMessage: string;
}

export interface IBinanceQueryOrderResponse {
  merchantId: number;
  prepayId: string;
  merchantTradeNo: string;
  status:
    | "INITIAL"
    | "PENDING"
    | "PAID"
    | "CANCELED"
    | "ERROR"
    | "REFUNDING"
    | "REFUNDED"
    | "FULL_REFUNDED"
    | "EXPIRED";
  currency: string;
  orderAmount: string;
  createTime: number;
  transactionId?: string;
  openUserId?: string;
  passThroughInfo?: string;
  transactTime?: number;
  paymentInfo?: {
    payerId: string;
    payMethod: string;
    paymentInstructions: IBinancePaymentInstruction[];
    channel?: string;
    subChannel?: string;
    payerDetail?: string;
  };
}

export interface IBinancePaymentInstruction {
  currency: string;
  amount: string;
  price: string;
}

export interface IBinanceRefundResponse {
  status: "SUCCESS" | "FAIL";
  code: string;
  data?: IBinanceRefundResult;
  errorMessage?: string;
}

export interface IBinanceRefundResult {
  refundRequestId: string;
  prepayId: string;
  orderAmount: string;
  refundedAmount: string;
  refundAmount: string;
  remainingAttempts: number;
  payerOpenId: string;
  duplicateRequest: "Y" | "N";
}
