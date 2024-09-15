import {
  Entity,
  PrimaryGeneratedColumn,
  Index,
  Column,
  OneToMany,
} from "typeorm";

import { MarketListing } from ".";

@Entity()
export class Animation {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(() => MarketListing, (marketListing) => marketListing.animation)
  marketListing: MarketListing[];

  @Index({ unique: true })
  @Column({ type: "varchar", length: 555 })
  url: string;

  @Column({ default: false, type: "boolean" })
  validated: boolean;
}
