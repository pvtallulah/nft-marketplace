// import { IWSSResponse, INftData } from "./IWSSResponse";
import { INftSoldReq } from "./INftSoldReq";
// import { INftBoughtReq } from "./INftBoughtReq";
import { IUpdateNftDbPrice } from "./IUpdateNftDbPrice";
// import { INftDataReq } from "./INftDataReq";
import { ITransactionLog } from "./ITransactionLog";
import { ITransactionData } from "./ITransactionData";
import { ITransactionBlockchainLog } from "./ITransactionBlockchainLog";
import { ITransactionReceipt } from "./ITransactionReceipt";
import { ITransactionReceiptData } from "./ITransactionReceiptData";
import { INftPrice } from "./INftPrice";
import { ISellerNft } from "./ISellerNft";
import { IDGResponse } from "./IDGResponse";
// import { IMarketListingGroupedResponse } from "./IMarketListingGroupedResponse";
import { IAddressParams } from "./IAddressParams";
import { IMarketListingsGroupedParams } from "./IMarketListingsGroupedParams";
import { IDgTransactionInfo } from "./IDgTransactionInfo";
import { ISlotPostParams } from "./ISlotPostParams";
import { ISlotPutParams } from "./ISlotPutParams";
import { ISlotDeleteParams } from "./ISlotDeleteParams";
import { ICoinmarketcapPrice } from "./ICoinmarketcapPrice";

import { IPolyscanTxResponse } from "./IPolyscan";

export * from "./ICoinbase";
export * from "./IPaper";
export * from "./ICollection";
export * from "./IWebSocket";
export * from "./IMarketplace";
export * from "./IMarketListingGroupedResponse";
export * from "./IBinanceLink";
export * from "./IAlchemy";
export * from "./IImages";
export * from "./IAnalytics";
export * from "./IThirPartyTransaction";
export * from "./ICollectionMetadata";
export * from "./IWSSResponse";
export * from "./IUser";
export * from "./IUserUpdate";
export * from "./IMedia";
export * from "./IMediaRequest";
export * from "./IMediaAccess";
export * from "./IChat";
export * from "./IActivity";

export {
  // IWSSResponse,
  // INftData,
  INftSoldReq,
  IUpdateNftDbPrice,
  // INftDataReq,
  // INftBoughtReq,
  ITransactionLog,
  ITransactionReceipt,
  ITransactionData,
  ITransactionBlockchainLog,
  ITransactionReceiptData,
  INftPrice,
  ISellerNft,
  // IMarketListingGroupedResponse,
  IDGResponse,
  IAddressParams,
  IMarketListingsGroupedParams,
  IDgTransactionInfo,
  ISlotPostParams,
  ISlotPutParams,
  ISlotDeleteParams,
  ICoinmarketcapPrice,
  IPolyscanTxResponse,
};
