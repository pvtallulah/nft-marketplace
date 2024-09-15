import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { IWSNotifyMarketplace } from "../../interfaces";
@Entity()
export class DashboardQueue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "simple-json", nullable: false })
  data: IWSNotifyMarketplace;
}
