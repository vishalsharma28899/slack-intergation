// import { 
//   users, conversations, messages, 
//   type User, type InsertUser,
//   type Conversation, type InsertConversation,
//   type Message, type InsertMessage 
// } from "@shared/schema";
// import { db } from "./db";
// import { eq, desc, and } from "drizzle-orm";

// export interface IStorage {
//   // Users
//   getUser(id: string): Promise<User | undefined>;
//   getUserByEmail(email: string): Promise<User | undefined>;
//   createUser(user: InsertUser): Promise<User>;

//   // Conversations
//   getConversation(id: string): Promise<Conversation | undefined>;
//   getConversationBySlackThread(slackThreadTs: string): Promise<Conversation | undefined>;
//   getUserConversations(userId: string): Promise<Conversation[]>;
//   createConversation(conversation: InsertConversation): Promise<Conversation>;
//   updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation>;

//   // Messages
//   getConversationMessages(conversationId: string): Promise<Message[]>;
//   createMessage(message: InsertMessage): Promise<Message>;
//   updateMessage(id: string, updates: Partial<Message>): Promise<Message>;
// }

// export class DatabaseStorage implements IStorage {
//   async getUser(id: string): Promise<User | undefined> {
//     const [user] = await db.select().from(users).where(eq(users.id, id));
//     return user || undefined;
//   }

//   async getUserByEmail(email: string): Promise<User | undefined> {
//     const [user] = await db.select().from(users).where(eq(users.email, email));
//     return user || undefined;
//   }

//   async createUser(insertUser: InsertUser): Promise<User> {
//     const [user] = await db
//       .insert(users)
//       .values(insertUser)
//       .returning();
//     return user;
//   }

//   async getConversation(id: string): Promise<Conversation | undefined> {
//     const [conversation] = await db
//       .select()
//       .from(conversations)
//       .where(eq(conversations.id, id));
//     return conversation || undefined;
//   }

//   async getConversationBySlackThread(slackThreadTs: string): Promise<Conversation | undefined> {
//     const [conversation] = await db
//       .select()
//       .from(conversations)
//       .where(eq(conversations.slackThreadTs, slackThreadTs));
//     return conversation || undefined;
//   }

//   async getUserConversations(userId: string): Promise<Conversation[]> {
//     return await db
//       .select()
//       .from(conversations)
//       .where(eq(conversations.userId, userId))
//       .orderBy(desc(conversations.updatedAt));
//   }

//   async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
//     const [conversation] = await db
//       .insert(conversations)
//       .values(insertConversation)
//       .returning();
//     return conversation;
//   }

//   async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation> {
//     const [conversation] = await db
//       .update(conversations)
//       .set({ ...updates, updatedAt: new Date() })
//       .where(eq(conversations.id, id))
//       .returning();
//     return conversation;
//   }

//   async getConversationMessages(conversationId: string): Promise<Message[]> {
//     return await db
//       .select()
//       .from(messages)
//       .where(eq(messages.conversationId, conversationId))
//       .orderBy(messages.createdAt);
//   }

//   async createMessage(insertMessage: InsertMessage): Promise<Message> {
//     const [message] = await db
//       .insert(messages)
//       .values(insertMessage)
//       .returning();
//     return message;
//   }

//   async updateMessage(id: string, updates: Partial<Message>): Promise<Message> {
//     const [message] = await db
//       .update(messages)
//       .set(updates)
//       .where(eq(messages.id, id))
//       .returning();
//     return message;
//   }
// }

// export const storage = new DatabaseStorage();
 import { User, Conversation, Message } from "./db.mongo";

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