import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";

import { NftAddress } from "./index";
@Entity()
export class NftType {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToMany(() => NftAddress, (nftAddress) => nftAddress.nftType)
  nftAddress: NftAddress[];

  @Column({ type: "varchar", length: 50 })
  type: string;
}
