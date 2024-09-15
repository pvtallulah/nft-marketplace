import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("media")
export class Media {
  @PrimaryGeneratedColumn()
  media_id: number;

  @Column({ type: "varchar", length: 70 })
  media_hash: string;

  @Column("varchar", { length: 255 })
  mime_type: string;

  @Column("varchar", { length: 10 })
  file_extension: string;

  @Column("varchar", { length: 255, nullable: false, default: "" })
  file_name: string;
}
