import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity()
export class StripeRateLimit {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 42 })
  address: string;

  @Column({ type: "int", default: 0 })
  count: number;

  @CreateDateColumn({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP(6)",
  })
  created_at: Date;
}
