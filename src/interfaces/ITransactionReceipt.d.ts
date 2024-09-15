export interface GasUsed {
  _hex: string;
  _isBigNumber: boolean;
}

export interface TransactionReceiptLog {
  transactionIndex: number;
  blockNumber: number;
  transactionHash: string;
  address: string;
  topics: string[];
  data: string;
  logIndex: number;
  blockHash: string;
}

export interface CumulativeGasUsed {
  _hex: string;
  _isBigNumber: boolean;
}

export interface EffectiveGasPrice {
  _hex: string;
  _isBigNumber: boolean;
}

export interface ITransactionReceipt {
  to: string;
  from: string;
  contractAddress?: any;
  transactionIndex: number;
  gasUsed: GasUsed;
  logsBloom: string;
  blockHash: string;
  transactionHash: string;
  logs: TransactionReceiptLog[];
  blockNumber: number;
  confirmations: number;
  cumulativeGasUsed: CumulativeGasUsed;
  effectiveGasPrice: EffectiveGasPrice;
  status?: number;
  type: number;
  byzantium: boolean;
}

export interface ITransactionReceiptDb {
  to: string;
  from: string;
  contractAddress: string | null;
  transactionIndex: number;
  gasUsed: {
    _hex: string;
    _isBigNumber: boolean;
  };
  logsBloom: string;
  blockHash: string;
  transactionHash: string;
  logs: {
    transactionIndex: number;
    blockNumber: number;
    transactionHash: string;
    address: string;
    topics: string[];
    data: string;
    logIndex: number;
    blockHash: string;
  }[];
  blockNumber: number;
  confirmations: number;
  cumulativeGasUsed: {
    _hex: string;
    _isBigNumber: boolean;
  };
  effectiveGasPrice: {
    _hex: string;
    _isBigNumber: boolean;
  };
  status: number;
  type: number;
  byzantium: boolean;
}
