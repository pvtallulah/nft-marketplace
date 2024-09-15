export interface GasPrice {
  _hex: string;
  _isBigNumber: boolean;
}

export interface MaxPriorityFeePerGas {
  _hex: string;
  _isBigNumber: boolean;
}

export interface MaxFeePerGas {
  _hex: string;
  _isBigNumber: boolean;
}

export interface GasLimit {
  _hex: string;
  _isBigNumber: boolean;
}

export interface Value {
  _hex: string;
  _isBigNumber: boolean;
}

export interface ITransactionData {
  hash: string;
  type?: number;
  accessList?: any[];
  blockHash?: string;
  blockNumber?: number;
  transactionIndex?: number;
  confirmations: number;
  from: string;
  gasPrice?: GasPrice;
  maxPriorityFeePerGas?: MaxPriorityFeePerGas;
  maxFeePerGas?: MaxFeePerGas;
  gasLimit?: GasLimit;
  to?: string;
  value: Value;
  nonce: number;
  data: string;
  r?: string;
  s?: string;
  v?: number;
  creates?: any;
  chainId: number;
}
