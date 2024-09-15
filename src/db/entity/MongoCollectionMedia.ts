import { Entity, PrimaryColumn, Column, ObjectIdColumn } from "typeorm";

@Entity("collection_media") // Specifies the collection name 'collection_media'
export class CollectionMedia {
  @ObjectIdColumn()
  _id: string;

  @Column("array")
  media_ids: number[];
}
