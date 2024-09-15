import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from "typeorm";

import { stringToBool } from "../../utils";
@Entity()
export class Collection {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 42 })
  walletAddress: string;

  @Unique("CollectionAddressUnique", ["collectionAddress"])
  @Column({ type: "varchar", length: 42 })
  collectionAddress: string;

  @Column({ type: "varchar", length: 255 })
  collectionName: string;

  @Column({ type: "varchar", length: 500, nullable: true })
  collectionImage: string;

  @Column({ type: "varchar", length: 100 })
  type: string;

  @Column({
    default: 1,
    transformer: stringToBool,
  })
  visible: boolean;

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
