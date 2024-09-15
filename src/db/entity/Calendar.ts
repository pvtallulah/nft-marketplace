import { Entity, PrimaryColumn, Index, OneToMany } from "typeorm";

import { TransactionLog } from "./";
@Entity()
export class Calendar {
  @PrimaryColumn({ type: "date" })
  @OneToMany(() => TransactionLog, (transactionLog) => transactionLog.date)
  calendarDate: Date[];
}
