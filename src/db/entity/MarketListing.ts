import {
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToOne,
  Column,
  Unique,
  ValueTransformer,
  Index,
} from "typeorm";
import { stringToBool, fixedPrice } from "../../utils";

import {
  ResourceGroup,
  Seller,
  Uri,
  Animation,
  Youtube,
  Audio,
  Description,
} from "./";

@Entity()
@Unique("unique_market_listing", ["tokenId", "resourceGroup", "preprocessedId"])
export class MarketListing {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @ManyToOne(
    () => ResourceGroup,
    (resourceGroup) => resourceGroup.marketListing
  )
  resourceGroup: ResourceGroup;

  @ManyToOne(() => Seller, (seller) => seller.marketListing)
  seller: Seller;

  @ManyToOne(() => Uri, (uri) => uri.marketListing)
  uri: Uri;

  @ManyToOne(() => Animation, (animation) => animation.marketListing)
  animation: Animation;

  @ManyToOne(() => Youtube, (youtube) => youtube.marketListing)
  youtube: Youtube;

  @ManyToOne(() => Audio, (audio) => audio.marketListing)
  audio: Audio;

  @ManyToOne(() => Description, (description) => description.marketListing)
  description: Description;

  @Column({ type: "varchar", length: 255 })
  tokenId: string;

  @Column({ type: "boolean", default: true, transformer: stringToBool })
  active: boolean;

  @Column({ type: "boolean", default: true, transformer: stringToBool })
  validated: boolean;

  @Column({
    type: "decimal",
    precision: 65,
    scale: 18,
    default: 0,
    transformer: fixedPrice,
  })
  price: number;

  @Column({ type: "varchar", length: 255, nullable: true })
  preprocessedId: string;

  @Column({ type: "int", default: 0 })
  preprocessedCount: number;

  // @Column({ type: "timestamp" })
  // timestamp: Date;
}
