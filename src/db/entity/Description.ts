import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";

import { MarketListing } from ".";
import { stringToMD5 } from "../../utils";

@Entity()
export class Description {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(() => MarketListing, (marketListing) => marketListing.description)
  marketListing: MarketListing[];

  @Column({ type: "varchar", length: 32 })
  hashDescription: string;

  @Column({ type: "varchar", length: 500 })
  description: string;
}
