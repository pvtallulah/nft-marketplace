import {
  Entity,
  PrimaryGeneratedColumn,
  Index,
  Column,
  OneToMany,
} from "typeorm";

import { MarketListing } from ".";
import { bool } from "aws-sdk/clients/signer";

@Entity()
export class Uri {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(() => MarketListing, (marketListing) => marketListing.uri)
  marketListing: MarketListing[];

  @Index({ unique: true })
  @Column({ type: "varchar", length: 555 })
  uriUrl: string;

  @Column({ type: "simple-json", nullable: true })
  metadata: string;

  @Column({ type: "varchar", length: 555, nullable: true })
  s3Url: string;

  @Column({ type: "varchar", length: 256, nullable: true })
  imgUUID: string;

  @Column({ type: "varchar", length: 555, nullable: true })
  key: string;

  @Column({ type: "bool", default: false })
  badUri: bool;
}
