import {
  Entity,
  PrimaryGeneratedColumn,
  Index,
  Column,
  OneToMany,
} from "typeorm";

import { MarketListing, TransactionLog } from "./";

@Entity()
export class Seller {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(() => MarketListing, (marketListing) => marketListing.seller)
  marketListing: MarketListing[];

  @OneToMany(
    () => TransactionLog,
    (transactionLog) => transactionLog.fromWallet
  )
  transactionLogFromWallet: TransactionLog[];

  @OneToMany(
    () => TransactionLog,
    (transactionLog) => transactionLog.fromWallet
  )
  transactionLogToWallet: TransactionLog[];

  @OneToMany(
    () => TransactionLog,
    (transactionLog) => transactionLog.fromWallet
  )
  transactionLogRecipientWallet: TransactionLog[];

  @Index({ unique: true })
  @Column({ type: "varchar", length: 42 })
  sellerAddress: string;
}
