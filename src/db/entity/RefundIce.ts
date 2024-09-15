import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { fixedPrice } from "../../utils";
@Entity()
export class RefundIce {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 42 })
  wallet: string;
  @Column({ type: "varchar", length: 100 })
  transactionHash: string;
  @Column({
    type: "decimal",
    precision: 65,
    scale: 18,
    default: 0,
    transformer: fixedPrice,
  })
  price: number;
}
