import { Entity, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { Conversation, User } from "./";

@Entity("conversation_participants")
export class ConversationParticipants {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.idUser)
  user: User;

  @ManyToOne(() => Conversation, (conversation) => conversation.id)
  conversation: Conversation;
}
