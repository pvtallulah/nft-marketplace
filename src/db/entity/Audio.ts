import {
  Entity,
  PrimaryGeneratedColumn,
  Index,
  Column,
  OneToMany,
} from "typeorm";

import { MarketListing } from ".";

@Entity()
export class Audio {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(() => MarketListing, (marketListing) => marketListing.audio)
  marketListing: MarketListing[];

  @Index({ unique: true })
  @Column({ type: "varchar", length: 555 })
  url: string;

  @Column({ default: false, type: "boolean" })
  validated: boolean;
}
