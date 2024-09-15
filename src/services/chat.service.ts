import { Participant, SimpleUser } from "interfaces";
import {
  Message,
  Conversation,
  ConversationParticipants,
  User,
} from "../db/entity";
import { AppDataSource } from "../db/data-source";
import { In, Like, Not } from "typeorm";
import { ValidateError } from "tsoa";
import { isAddress } from "../utils";
const messageRepository = AppDataSource.getRepository(Message);
const conversationRepository = AppDataSource.getRepository(Conversation);
const conversationParticipantsRepository = AppDataSource.getRepository(
  ConversationParticipants
);
const userRepository = AppDataSource.getRepository(User);

export const saveMessage = async (
  fromUserId: string,
  toUserId: string,
  messageContent: string,
  conversationId: string
): Promise<Message> => {
  const conversation = await conversationRepository.findOne({
    where: { id: conversationId },
  });
  if (!conversation) throw new Error("Conversation not found");

  const newMessage = new Message();
  newMessage.fromUserId = fromUserId;
  newMessage.toUserId = toUserId;
  newMessage.message = messageContent;
  newMessage.timestamp = new Date();
  newMessage.conversation = conversation;
  return await messageRepository.save(newMessage);
};

export const getMessagesForConversation = async (
  conversationId: string
): Promise<Message[]> => {
  return await messageRepository.find({
    where: { conversation: { id: conversationId } },
    order: { timestamp: "ASC" },
  });
};

export const deleteMessage = async (messageId: number): Promise<void> => {
  await messageRepository.delete(messageId);
};

export const updateMessage = async (
  messageId: number,
  newMessageContent: string
): Promise<void> => {
  await messageRepository.update(messageId, { message: newMessageContent });
};

// Get a single message
export const getSingleMessage = async (
  messageId: number
): Promise<Message | undefined> => {
  return await messageRepository.findOne({
    where: { id: messageId },
  });
};

// export const upsertUser = async ({
//   walletAddress,
//   name,
//   avatar,
// }: {
//   walletAddress: string;
//   name: string;
//   avatar: string;
// }): Promise<User> => {
//   const foundUser = await userRepository.findOne({
//     where: {
//       address: walletAddress,
//     },
//   });

//   if (foundUser) {
//     return foundUser;
//   }
//   const newUser = new User();
//   newUser.address = walletAddress;
//   newUser.username = name || walletAddress;
//   newUser.avatar = avatar || "";
//   return await userRepository.save(newUser);
// };

export const createNewConversation = async (
  participant1: Participant,
  participant2: Participant
): Promise<Conversation> => {
  const participant1User = await userRepository.findOne({
    where: { address: participant1.walletAddress },
  });

  const participant2User = await userRepository.findOne({
    where: { address: participant2.walletAddress },
  });

  if (!participant1User || !participant2User) {
    const wallet = !participant1User
      ? participant1.walletAddress
      : participant2.walletAddress;
    throw new ValidateError(
      {},
      "Invalid participant(s), user not found for wallet: " + wallet
    );
  }
  const foundConversation = await conversationParticipantsRepository.findOne({
    where: {
      user: {
        idUser: In([participant1User.idUser, participant2User.idUser]),
      },
    },
    relations: ["conversation"],
  });
  const asd = await conversationRepository.findBy({});
  if (foundConversation) return foundConversation.conversation;
  const newConversation = new Conversation();
  await conversationRepository.save(newConversation);

  const participant1Entry = new ConversationParticipants();
  participant1Entry.user = participant1User;
  participant1Entry.conversation = newConversation;

  const participant2Entry = new ConversationParticipants();
  participant2Entry.user = participant2User;
  participant2Entry.conversation = newConversation;

  await conversationParticipantsRepository.save([
    participant1Entry,
    participant2Entry,
  ]);

  return newConversation;
};

export const getConversationsForWallet = async (
  walletAddress: string
): Promise<Conversation[]> => {
  const chatUser = await userRepository.findOne({
    where: { address: walletAddress },
  });
  if (!chatUser) {
    return [];
  }

  const participants = await conversationParticipantsRepository.find({
    where: {
      user: {
        address: walletAddress,
      },
    },
    relations: ["conversation"],
  });

  return participants.map((p) => p.conversation);
};

export const getParticipantsForConversation = async (
  conversationId: string
): Promise<User[]> => {
  const participants = await conversationParticipantsRepository.find({
    where: { conversation: { id: conversationId } },
    relations: {
      user: true,
    },
  });
  return participants.map((p) => p.user);
};

export const getChatUserForWallet = async (
  walletAddress: string
): Promise<User> => {
  try {
    const foundUser = await userRepository.findOne({
      select: {
        username: true,
        avatar: true,
        address: true,
        email: true,
        emailEnabled: true,
      },
      where: { address: walletAddress },
    });
    if (foundUser) return foundUser;
    return null;
  } catch (err) {
    throw err;
  }
};

export const getParticipantForWallet = async (
  conversationId: string,
  walletAddress: string
): Promise<User> => {
  try {
    const foundParticipant = await conversationParticipantsRepository.findOne({
      select: {
        user: {
          username: true,
          avatar: true,
          address: true,
          email: true,
          emailEnabled: true,
        },
      },
      where: {
        conversation: { id: conversationId },
        user: { address: Not(walletAddress) },
      },
      relations: {
        user: true,
      },
    });
    if (foundParticipant) return foundParticipant.user;
    return null;
  } catch (err) {
    throw err;
  }
};

export const getLastMessageForConversation = async (
  conversationId: string
): Promise<Message> => {
  const lastMessage = await messageRepository.findOne({
    where: { conversation: { id: conversationId } },
    order: { timestamp: "DESC" },
  });
  return lastMessage;
};

export const findUsers = async (
  searchTerm: string
): Promise<SimpleUser | SimpleUser[]> => {
  if (isAddress(searchTerm)) {
    const foundUser = await userRepository.findOne({
      where: { address: searchTerm },
      select: {
        username: true,
        avatar: true,
        address: true,
        email: true,
        emailEnabled: true,
      },
    });
    const mappedUser: SimpleUser = {
      username: foundUser.username,
      avatar: foundUser.avatar,
      address: foundUser.address,
      email: foundUser.email,
      emailEnabled: foundUser.emailEnabled,
    };
    return mappedUser;
  } else {
    const foundUsers = await userRepository.find({
      where: { username: Like(`%${searchTerm}%`) },
      select: {
        username: true,
        avatar: true,
        address: true,
        email: true,
        emailEnabled: true,
      },
    });
    const mappedUsers: SimpleUser[] = foundUsers.map((user) => ({
      username: user.username,
      avatar: user.avatar,
      address: user.address,
      email: user.email,
      emailEnabled: user.emailEnabled,
    }));
    return mappedUsers;
  }
};
