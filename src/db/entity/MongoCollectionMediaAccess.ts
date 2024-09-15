import { Entity, PrimaryColumn, Column, ObjectIdColumn } from "typeorm";

export class TokenAccess {
  @Column("array")
  token_ids: number[];

  @Column("array")
  media_ids: number[];
}

@Entity("collectionMediaAccess") // Specifies the collection name 'collection_media_access'
export class CollectionMediaAccess {
  @ObjectIdColumn()
  _id: string;

  @Column()
  contractAddress: string; // new field

  @Column((type) => TokenAccess)
  token_access: TokenAccess[];

 
}
