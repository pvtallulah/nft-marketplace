import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Init {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: false })
  generated: boolean;
}
