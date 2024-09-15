import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Conversation } from "./";

@Entity("message")
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 255 })
  fromUserId: string;

  @Column({ type: "varchar", length: 255 })
  toUserId: string;

  @Column()
  message: string;

  @Column()
  timestamp: Date;

  @Column({ type: "varchar", length: 255, nullable: true })
  mediaType: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  mediaUrl: string;

  @ManyToOne(() => Conversation, (conversation) => conversation.id)
  conversation: Conversation;
}
