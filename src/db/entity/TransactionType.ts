import {
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  Column,
  Index,
} from "typeorm";

import { TransactionLog } from "./TransactionLog";
@Entity()
export class TransactionType {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: "varchar", length: 255 })
  type: string;

  @OneToMany(
    () => TransactionLog,
    (transactionLog) => transactionLog.transactionType
  )
  transactionLog: TransactionLog;
}
