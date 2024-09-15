import {
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  Column,
  Index,
} from "typeorm";

import { TransactionLog } from "./index";
@Entity()
export class TransactionStatus {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 255 })
  status: string;

  @OneToMany(
    () => TransactionLog,
    (transactionLog) => transactionLog.transactionType
  )
  transactionLog: TransactionLog;
}
