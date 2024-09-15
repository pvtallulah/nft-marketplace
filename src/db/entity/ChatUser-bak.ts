import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("chat_user")
export class ChatUser {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 42 })
  walletAddress: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "varchar", length: 255 })
  avatar: string;
}
