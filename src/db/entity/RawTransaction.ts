import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class RawTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  transactionHash: string;

  @Column()
  blockNumber: number;

  // Column with JSON data type
  @Column("simple-json", { nullable: true })
  transactionInfo: {
    blockNumber: number;
    blockHash: string;
    transactionIndex: number;
    removed: boolean;
    address: string;
    data: string;
    topics: string[];
    transactionHash: string;
    logIndex: number;
  };

  @Column("simple-json", { nullable: true })
  receiptInfo: {
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
  };

  @Column({ type: "timestamp" })
  timestamp: Date;
}
