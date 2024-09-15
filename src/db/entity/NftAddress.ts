import {
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  Column,
  Unique,
} from "typeorm";

import { ResourceGroup, NftType, TransactionLog } from "./index";
import { stringToBool, fixedPrice } from "../../utils";

@Entity()
@Unique("unique_nft_address", ["nftAddress"])
export class NftAddress {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => NftType, (nftType) => nftType.nftAddress)
  nftType: NftType;

  @OneToMany(() => ResourceGroup, (resourceGroup) => resourceGroup.nftAddress)
  // @ManyToOne(() => ResourceGroup, (resourceGroup) => resourceGroup.nftAddress)
  resourceGroup: ResourceGroup;

  @OneToMany(
    () => TransactionLog,
    (transactionLog) => transactionLog.nftAddress
  )
  // @ManyToOne(() => ResourceGroup, (resourceGroup) => resourceGroup.nftAddress)
  transactionLog: TransactionLog;

  @Column({ type: "varchar", length: 42 })
  nftAddress: string;

  @Column({ type: "varchar", length: 255, default: "no-name", nullable: true })
  name: string;

  @Column({ type: "varchar", length: 100, nullable: true })
  symbol: string;

  @Column({
    type: "decimal",
    precision: 65,
    scale: 18,
    default: 0,
    transformer: fixedPrice,
  })
  iceAmount: number;

  @Column({
    type: "bigint",
    default: 0,
    transformer: fixedPrice,
  })
  totalSales: number;

  @Column({ type: "boolean", default: false, transformer: stringToBool })
  isWearable: boolean;

  @Column({ type: "boolean", default: false, transformer: stringToBool })
  isIceCollection: boolean;

  @Column({ type: "boolean", default: false, transformer: stringToBool })
  isDecentraland: boolean;

  @Column({ type: "boolean", default: false, transformer: stringToBool })
  isVerifiedCollection: boolean;

  @Column({ type: "boolean", default: false, transformer: stringToBool })
  banned: boolean;
}
