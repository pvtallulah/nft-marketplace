import {
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  Column,
  Index,
  Unique,
} from "typeorm";

import { MarketListing } from "./MarketListing";
import { NftAddress } from "./NftAddress";

@Entity()
@Unique("ResourceGroupUnique", ["nftAddress", "resourceId"])
export class ResourceGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(
    () => MarketListing,
    (marketListing) => marketListing.resourceGroup
  )
  marketListing: MarketListing[];

  @Index()
  @ManyToOne(() => NftAddress, (nftAddress) => nftAddress.resourceGroup)
  nftAddress: NftAddress;

  @Column({ type: "varchar", length: 32 })
  resourceId: string;

  @Column({ type: "int", nullable: true })
  width: number;

  @Column({ type: "int", nullable: true })
  height: number;

  @Column({ type: "varchar", length: 555 })
  imageUrl: string;

  @Column({ type: "varchar", length: 555 })
  name: string;
}
