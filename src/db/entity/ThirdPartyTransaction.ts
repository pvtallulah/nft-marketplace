import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity()
export class ThirdPartyTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 100 })
  paymentId: string;

  @Column({ type: "varchar", length: 100 })
  amountFiat: string;

  @Column({ type: "varchar", length: 100 })
  amountIce: string;

  @Column({ type: "varchar", length: 100 })
  conversionRate: string;

  @Column({ type: "varchar", length: 42 })
  nftAddress: string;

  @Column({ type: "varchar", length: 255 })
  tokenId: string;

  @Column({ type: "varchar", length: 255 })
  resourceId: string;

  @Column({ type: "varchar", length: 42 })
  buyerWallet: string;

  @Column({ type: "varchar", length: 42 })
  sellerAddress: string;

  @Column({ type: "varchar", length: 200 })
  status: string;

  @Column({ type: "varchar", length: 20 })
  type: string;

  @Column({ type: "varchar", length: 5000, nullable: true })
  notes: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  transactionHash: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  email: string;

  @CreateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP(6)",
  })
  created_at: Date;

  @UpdateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP(6)",
    onUpdate: "CURRENT_TIMESTAMP(6)",
  })
  updated_at: Date;
}
