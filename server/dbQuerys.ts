import { ObjectId } from "mongodb";
import { User, Conversation, Message } from "./slackChatModel";

export interface IStorage {
  // Users
  getUser(id: string): Promise<any | undefined>;
  getUserByEmail(email: string): Promise<any | undefined>;
  createUser(user: any): Promise<any>;

  // Conversations
  getConversation(id: string): Promise<any | undefined>;
  getConversationBySlackThread(slackThreadTs: string): Promise<any | undefined>;
  getConversationBySlackChannel(channelId: string): Promise<any | undefined>; // ✅ Added
  getUserConversations(userId: string): Promise<any[]>;
  createConversation(conversation: any): Promise<any>;
  updateConversation(id: string, updates: Partial<any>): Promise<any>;
  getActiveConversationByUser(userId: string): Promise<any | null>; // ✅ Added

  // Messages
  getConversationMessages(conversationId: string): Promise<any[]>;
  createMessage(message: any): Promise<any>;
  updateMessage(id: string, updates: Partial<any>): Promise<any>;
}

export class MongoDBStorage implements IStorage {
  // 🔹 USERS
  async getUser(id: string): Promise<any | undefined> {
    return (await User.findById(id)) || undefined;
  }

  async getUserByEmail(email: string): Promise<any | undefined> {
    return (await User.findOne({ email })) || undefined;
  }

  async createUser(userData: any): Promise<any> {
    try {
      if (!userData.username || userData.username === userData.email) {
        userData.username = userData.email;
      }

      const user = new User(userData);
      await user.save();
      return user;
    } catch (error: any) {
      if (error.code === 11000 && error.keyPattern?.username) {
        userData.username = `${userData.username}_${Date.now()}`;
        const user = new User(userData);
        await user.save();
        return user;
      }
      throw error;
    }
  }

  // 🔹 CONVERSATIONS
  async getConversation(id: string): Promise<any | undefined> {
    return (await Conversation.findById(id)) || undefined;
  }

  async getConversationBySlackThread(slackThreadTs: string): Promise<any | undefined> {
    return (await Conversation.findOne({ slackThreadTs })) || undefined;
  }

  async getConversationBySlackChannel(channelId: string): Promise<any | undefined> {
    return (await Conversation.findOne({ slackChannelId: channelId })) || undefined;
  }

  async getUserConversations(userId: string): Promise<any[]> {
    return await Conversation.find({ userId }).sort({ updatedAt: -1 });
  }

  async getActiveConversationByUser(userId: string) {
    console.log("🔎 getActiveConversationByUser called with userId:", userId);

    let query: any = {};

    try {
      // Try casting to ObjectId
      query.userId = new ObjectId(userId);
    } catch (err) {
      console.warn("⚠️ Could not cast userId to ObjectId, using raw string:", userId);
      query.userId = userId;
    }

    console.log("📋 Query being used:", query);

    const conversation = await Conversation.findOne(query);

    console.log("🗂 Conversation found:", conversation ? conversation._id.toString() : null);

    return conversation;
  }

  async createConversation(conversationData: any): Promise<any> {
    if (!conversationData.userId) {
      throw new Error("userId is required for creating a conversation");
    }

    const conversation = new Conversation(conversationData);
    await conversation.save();
    return conversation;
  }

  async updateConversation(id: string, updates: Partial<any>): Promise<any> {
    return await Conversation.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    );
  }

  // 🔹 MESSAGES
  async getConversationMessages(conversationId: string): Promise<any[]> {
    return await Message.find({ conversationId }).sort({ createdAt: 1 });
  }

  async createMessage(messageData: any): Promise<any> {
    const message = new Message(messageData);
    await message.save();
    return message;
  }

  async updateMessage(id: string, updates: Partial<any>): Promise<any> {
    return await Message.findByIdAndUpdate(id, updates, { new: true });
  }
}

export const storage = new MongoDBStorage();