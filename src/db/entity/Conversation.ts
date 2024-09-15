import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("conversation")
export class Conversation {
  @PrimaryGeneratedColumn("uuid")
  id: string;
}
