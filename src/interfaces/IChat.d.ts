import { User, Conversation, Message } from "../db/entity";

export interface IMessageRequest {
  fromUserId: string;
  toUserId: string;
  messageContent: string;
  conversationId: number;
}

export interface IMessageResponse {
  id: number;
  fromUserId: string;
  toUserId: string;
  messageContent: string;
  timestamp: Date;
}

export interface IConversationData {
  id: string;
  participant: User;
  lastMessage?: Message;
}
export interface IConversationResponse {
  me: User;
  conversationData: IConversationData[];
}

export interface Participant {
  walletAddress: string;
}

export interface ICreateConversationRequest {
  participant1: Participant;
  participant2: Participant;
}

export interface ICreateConversationResponse {
  id: string;
  participants: string[];
}

export interface SimpleUser {
  address: string;
  username: string;
  email: string;
  emailEnabled: boolean;
  avatar: string;
}

export interface IFoundUsers {
  users: SimpleUser | SimpleUser[];
}
