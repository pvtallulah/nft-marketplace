import { Entity, Column, PrimaryColumn } from "typeorm";
import { CollectionTokenMetadata, TokensMetadataEntry } from "../../interfaces";

@Entity("metadata") // Specifies the collection name 'metadata'
export class CollectionMetadata {
  @PrimaryColumn()
  _id: string;

  @Column("array")
  tokensMetadata: TokensMetadataEntry[];
}
