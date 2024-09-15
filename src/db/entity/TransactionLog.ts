import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
  PrimaryColumn,
} from "typeorm";

import {
  TransactionType,
  TransactionStatus,
  Seller,
  NftAddress,
  Calendar,
} from "./index";
import { stringToBool } from "../../utils";
@Entity()
// @Index(["transactionHash", "tokenId"], { unique: true })
export class TransactionLog {
  @PrimaryColumn()
  id: number;

  @Column({ type: "varchar", length: 255 })
  transactionHash: string;

  @Column()
  blockNumber: number;

  @ManyToOne(
    () => TransactionType,
    (transactionType) => transactionType.transactionLog
  )
  transactionType: TransactionType;

  @ManyToOne(
    () => TransactionStatus,
    (transactionStatus) => transactionStatus.transactionLog
  )
  transactionStatus: TransactionStatus;

  @ManyToOne(() => Seller, (seller) => seller.transactionLogFromWallet)
  fromWallet: Seller;

  @ManyToOne(() => Seller, (seller) => seller.transactionLogToWallet, {
    nullable: true,
  })
  toWallet: Seller;

  @ManyToOne(() => Seller, (seller) => seller.transactionLogRecipientWallet)
  recipientWallet: Seller;

  @ManyToOne(() => NftAddress, (nftAddress) => nftAddress.transactionLog)
  nftAddress: NftAddress;

  @Column({ type: "varchar", length: 255 })
  tokenId: string;

  @Column({ type: "double", nullable: true })
  price: string;

  @Index()
  @ManyToOne(() => Calendar, (calendar) => calendar.calendarDate)
  date: Calendar;

  @Column({ type: "boolean", default: false, transformer: stringToBool })
  isValidated: boolean;

  @Column({ type: "timestamp" })
  createdAt: Date;
}
