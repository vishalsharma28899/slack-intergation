import { User, Conversation, Message } from './db.mongo';

export interface IStorage {
  // Users
  getUser(id: string): Promise<any | undefined>;
  getUserByEmail(email: string): Promise<any | undefined>;
  createUser(user: any): Promise<any>;

  // Conversations
  getConversation(id: string): Promise<any | undefined>;
  getConversationBySlackThread(slackThreadTs: string): Promise<any | undefined>;
  getUserConversations(userId: string): Promise<any[]>;
  createConversation(conversation: any): Promise<any>;
  updateConversation(id: string, updates: Partial<any>): Promise<any>;

  // Messages
  getConversationMessages(conversationId: string): Promise<any[]>;
  createMessage(message: any): Promise<any>;
  updateMessage(id: string, updates: Partial<any>): Promise<any>;
}

export class MongoDBStorage implements IStorage {
  async getUser(id: string): Promise<any | undefined> {
    const user = await User.findById(id);
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<any | undefined> {
    const user = await User.findOne({ email });
    return user || undefined;
  }

  async createUser(userData: any): Promise<any> {
    try {
      // If username is not provided or is the same as email, use email with a timestamp
      if (!userData.username || userData.username === userData.email) {
        userData.username = userData.email;
      }
      
      const user = new User(userData);
      await user.save();
      return user;
    } catch (error: any) {
      // Handle duplicate key error for username
      if (error.code === 11000 && error.keyPattern?.username) {
        // Add timestamp to make username unique
        userData.username = `${userData.username}_${Date.now()}`;
        const user = new User(userData);
        await user.save();
        return user;
      }
      throw error;
    }
  }

  async getConversation(id: string): Promise<any | undefined> {
    const conversation = await Conversation.findById(id);
    return conversation || undefined;
  }

  async getConversationBySlackThread(slackThreadTs: string): Promise<any | undefined> {
    const conversation = await Conversation.findOne({ slackThreadTs });
    return conversation || undefined;
  }

  async getUserConversations(userId: string): Promise<any[]> {
    return await Conversation.find({ userId }).sort({ updatedAt: -1 });
  }

  async createConversation(conversationData: any): Promise<any> {
    try {
      console.log("Received conversation data:", conversationData);
      // Ensure userId is present
      if (!conversationData.userId) {
        throw new Error("userId is required for creating a conversation");
      }
      
      const conversation = new Conversation(conversationData);
      await conversation.save();
      return conversation;
    } catch (error) {
      console.error("Error creating conversation:", error);
      throw error;
    }
  }

  async updateConversation(id: string, updates: Partial<any>): Promise<any> {
    const conversation = await Conversation.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: new Date() },
      { new: true }
    );
    return conversation;
  }

  async getConversationMessages(conversationId: string): Promise<any[]> {
    return await Message.find({ conversationId }).sort({ createdAt: 1 });
  }

  async createMessage(messageData: any): Promise<any> {
    const message = new Message(messageData);
    await message.save();
    return message;
  }

  async updateMessage(id: string, updates: Partial<any>): Promise<any> {
    const message = await Message.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    );
    return message;
  }
}

export const storage = new MongoDBStorage();