import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class RawResourceData {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 32 })
  resourceHash: string;

  @Column({ nullable: true })
  mime: string;

  @Column("mediumblob", { nullable: true })
  data: Buffer;
}
