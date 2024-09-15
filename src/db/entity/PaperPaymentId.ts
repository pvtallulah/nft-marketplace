import { Entity, PrimaryColumn, Column } from "typeorm";

@Entity()
export class PaperPaymentId {
  @PrimaryColumn()
  id: number;
  @Column()
  number: number;
}
