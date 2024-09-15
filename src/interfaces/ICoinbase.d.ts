export interface ICoinbaseLink {
  addresses: Addresses;
  brandColor: string;
  brandLogoURL: string;
  code: string;
  createdAt: Date;
  description: string;
  exchangeRates: ExchangeRates;
  expiresAt: Date;
  feeRate: number;
  feesSettled: boolean;
  hostedURL: string;
  id: string;
  localExchangeRates: LocalExchangeRates;
  logoURL: string;
  metadata: Metadata;
  name: string;
  offchainEligible: boolean;
  organizationName: string;
  paymentThreshold: PaymentThreshold;
  payments: any[];
  pricing: { [key: string]: OverpaymentAbsoluteThreshold };
  pricingType: string;
  pwcbOnly: boolean;
  resource: string;
  supportEmail: string;
  timeline: Timeline[];
  utxo: boolean;
}

export interface Metadata {}

// export interface PaymentThreshold {
//   overpaymentAbsoluteThreshold: OverpaymentAbsoluteThreshold;
//   overpaymentRelativeThreshold: string;
//   underpaymentAbsoluteThreshold: OverpaymentAbsoluteThreshold;
//   underpaymentRelativeThreshold: string;
// }
export interface Timeline {
  status: string;
  time: Date;
}

export interface ICoinbaseEvent {
  id: number;
  scheduledFor: Date;
  event: Event;
}

export interface Event {
  id: string;
  resource: string;
  type:
    | "charge:created"
    | "charge:confirmed"
    | "charge:failed"
    | "charge:delayed"
    | "charge:pending"
    | "charge:resolved";
  apiVersion: Date;
  createdAt: Date;
  data: Data;
}

export interface Data {
  code: string;
  name: string;
  description: string;
  hostedURL: string;
  createdAt: Date;
  expiresAt: Date;
  timeline: Timeline[];
  metadata: Metadata;
  pricingType: string;
  payments: any[];
  addresses: EventAddresses;
}

export interface EventAddresses {
  bitcoin: string;
  ethereum: string;
}

export interface Addresses {
  polygon: string;
  pusdc: string;
  pweth: string;
  ethereum: string;
  usdc: string;
  dai: string;
  apecoin: string;
  shibainu: string;
  tether: string;
  bitcoincash: string;
  dogecoin: string;
  litecoin: string;
  bitcoin: string;
}

export interface ExchangeRates {
  "APE-USD": string;
  "BCH-USD": string;
  "BTC-USD": string;
  "DAI-USD": string;
  "ETH-USD": string;
  "LTC-USD": string;
  "DOGE-USD": string;
  "SHIB-USD": string;
  "USDC-USD": string;
  "USDT-USD": string;
  "PUSDC-USD": string;
  "PWETH-USD": string;
  "PMATIC-USD": string;
}

export interface LocalExchangeRates {
  "APE-USD": string;
  "BCH-USD": string;
  "BTC-USD": string;
  "DAI-USD": string;
  "ETH-USD": string;
  "LTC-USD": string;
  "DOGE-USD": string;
  "SHIB-USD": string;
  "USDC-USD": string;
  "USDT-USD": string;
  "PUSDC-USD": string;
  "PWETH-USD": string;
  "PMATIC-USD": string;
}

export interface OverpaymentAbsoluteThreshold {
  amount: string;
  currency: string;
}

export interface UnderpaymentAbsoluteThreshold {
  amount: string;
  currency: string;
}

export interface PaymentThreshold {
  overpayment_absolute_threshold: OverpaymentAbsoluteThreshold;
  overpayment_relative_threshold: string;
  underpayment_absolute_threshold: UnderpaymentAbsoluteThreshold;
  underpayment_relative_threshold: string;
}

export interface Local {
  amount: string;
  currency: string;
}

export interface Polygon {
  amount: string;
  currency: string;
}

export interface Pusdc {
  amount: string;
  currency: string;
}

export interface Pweth {
  amount: string;
  currency: string;
}

export interface Ethereum {
  amount: string;
  currency: string;
}

export interface Usdc {
  amount: string;
  currency: string;
}

export interface Dai {
  amount: string;
  currency: string;
}

export interface Apecoin {
  amount: string;
  currency: string;
}

export interface Shibainu {
  amount: string;
  currency: string;
}

export interface Tether {
  amount: string;
  currency: string;
}

export interface Bitcoincash {
  amount: string;
  currency: string;
}

export interface Dogecoin {
  amount: string;
  currency: string;
}

export interface Litecoin {
  amount: string;
  currency: string;
}

export interface Bitcoin {
  amount: string;
  currency: string;
}

export interface Pricing {
  local: Local;
  polygon: Polygon;
  pusdc: Pusdc;
  pweth: Pweth;
  ethereum: Ethereum;
  usdc: Usdc;
  dai: Dai;
  apecoin: Apecoin;
  shibainu: Shibainu;
  tether: Tether;
  bitcoincash: Bitcoincash;
  dogecoin: Dogecoin;
  litecoin: Litecoin;
  bitcoin: Bitcoin;
}

export interface CoinbasePaymentStatusData {
  addresses: Addresses;
  brand_color: string;
  brand_logo_url: string;
  code: string;
  coinbase_managed_merchant: boolean;
  created_at: Date;
  exchange_rates: ExchangeRates;
  expires_at: Date;
  fee_rate: number;
  fees_settled: boolean;
  hosted_url: string;
  id: string;
  local_exchange_rates: LocalExchangeRates;
  logo_url: string;
  metadata: Metadata;
  name: string;
  offchain_eligible: boolean;
  organization_name: string;
  payment_threshold: PaymentThreshold;
  payments: any[];
  pricing: Pricing;
  pricing_type: string;
  pwcb_only: boolean;
  redirect_url: string;
  resource: string;
  support_email: string;
  timeline: Timeline[];
  utxo: boolean;
}

export interface CoinbasePaymentStatus {
  data: CoinbasePaymentStatusData;
}
export interface CoinbasePaymentStatusRes {
  status: "Awaiting payment" | "Processing payment" | "Payment complete";
}
