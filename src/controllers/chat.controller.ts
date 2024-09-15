import {
  Controller,
  Post,
  Route,
  ValidateError,
  Tags,
  Body,
  Get,
  Delete,
  Put,
  Path,
  Query,
} from "tsoa";
import * as chatService from "../services/chat.service"; // Replace with your actual import
import {
  IConversationData,
  IConversationResponse,
  ICreateConversationRequest,
  ICreateConversationResponse,
  IDGResponse,
  IFoundUsers,
  IMessageResponse,
} from "../interfaces"; // Replace with your actual import

@Route("chat")
@Tags("Chat")
export class ChatController extends Controller {
  @Get("conversations/{walletAddress}")
  public async getConversations(
    walletAddress: string
  ): Promise<IDGResponse<IConversationResponse>> {
    try {
      if (!walletAddress) {
        throw new ValidateError({}, "Wallet address is required");
      }
      const conversations = await chatService.getConversationsForWallet(
        walletAddress
      );
      const me = await chatService.getChatUserForWallet(walletAddress);
      if (!me)
        throw new ValidateError(
          {},
          `User not found for wallet address: ${walletAddress}`
        );
      let conversationsParticipants: IConversationData[] = [];
      conversationsParticipants = await Promise.all(
        conversations.map(async (conv) => {
          const participant = await chatService.getParticipantForWallet(
            conv.id,
            walletAddress
          );
          return {
            id: conv.id,
            participant,
            lastMessage: await chatService.getLastMessageForConversation(
              conv.id
            ),
          };
        })
      );
      return {
        status: 200,
        data: {
          me,
          conversationData: [...conversationsParticipants],
        },
        message: "Conversations fetched successfully",
      };
    } catch (e) {
      throw new ValidateError({}, e.message);
    }
  }

  @Get("messages/{conversationId}")
  public async getMessages(
    @Path() conversationId: string
  ): Promise<IDGResponse<IMessageResponse[]>> {
    try {
      if (!conversationId)
        throw new ValidateError({}, "Conversation Id is required");

      const messages = await chatService.getMessagesForConversation(
        conversationId
      );
      const response = messages.map((msg) => ({
        id: msg.id,
        fromUserId: msg.fromUserId,
        toUserId: msg.toUserId,
        messageContent: msg.message,
        timestamp: msg.timestamp,
      }));
      return {
        status: 200,
        data: response,
        message: "Messages fetched successfully",
      };
    } catch (e) {
      throw new ValidateError({}, e.message);
    }
  }

  @Delete("message/{messageId}")
  public async deleteMessage(
    @Path() messageId: number
  ): Promise<IDGResponse<null>> {
    try {
      await chatService.deleteMessage(messageId);
      return {
        status: 200,
        data: null,
        message: "Message deleted successfully",
      };
    } catch (e) {
      throw new ValidateError({}, e.message);
    }
  }

  @Put("message/{messageId}")
  public async updateMessage(
    @Path() messageId: number,
    @Body() newMessageContent: string
  ): Promise<IDGResponse<null>> {
    try {
      await chatService.updateMessage(messageId, newMessageContent);
      return {
        status: 200,
        data: null,
        message: "Message updated successfully",
      };
    } catch (e) {
      throw new ValidateError({}, e.message);
    }
  }

  @Post("conversation/")
  public async createConversation(
    @Body() requestBody: ICreateConversationRequest
  ): Promise<IDGResponse<ICreateConversationResponse>> {
    try {
      const { participant1, participant2 } = requestBody;
      const newConversation = await chatService.createNewConversation(
        participant1,
        participant2
      );

      const participants = await chatService.getParticipantsForConversation(
        newConversation.id
      );

      return {
        status: 200,
        data: {
          id: newConversation.id,
          participants: participants.map((p) => p.address),
        },
        message: "New conversation created successfully",
      };
    } catch (e) {
      throw new ValidateError({}, e.message);
    }
  }

  @Get("find-user/")
  public async findUser(@Query() q: string): Promise<IDGResponse<IFoundUsers>> {
    try {
      if (!q) throw new ValidateError({}, "Query is required");

      const foundedUsers = await chatService.findUsers(q);
      return {
        status: 200,
        data: {
          users: foundedUsers,
        },
        message: "Usert found successfully",
      };
    } catch (e) {
      throw new ValidateError({}, e.message);
    }
  }
}
