import { Entity, PrimaryColumn } from "typeorm";

@Entity()
export class CollectionsRevelableContent {
  @PrimaryColumn("char", { length: 42 })
  contractAddress: string;
}
