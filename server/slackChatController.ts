

import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { sendMessageToSlack, setupSlackEventHandlers } from "./services/slack";
import { generateAutoReply } from "./services/openai";
import { insertUserSchema } from "@shared/schema";
import { WebClient } from "@slack/web-api";
import dotenv from "dotenv";
import { storage } from "./dbQuerys";
dotenv.config();
const slack = new WebClient(process.env.SLACK_BOT_TOKEN);


export async function createSlackChannelForUser(userId: string, email: string) {
  const channelName = `chat-${userId.substring(0, 8)}`;
  try {
    // Try creating a new channel
    const channel = await slack.conversations.create({ name: channelName, is_private: false });

    // Invite support/admin users
    if (!channel.channel?.id) throw new Error("Failed to create Slack channel");
    await slack.conversations.invite({
      channel: channel.channel.id,
      users: process.env.SLACK_SUPPORT_USER_IDS!,
    });

    // Post welcome message
    const msg = await slack.chat.postMessage({
      channel: channel.channel.id,
      text: `New conversation started by *${email}*`,
    });

    return { channelId: channel.channel.id, ts: msg.ts };
  } catch (err: any) {
    // If channel already exists
    if (err.data?.error === "name_taken") {
      const list = await slack.conversations.list({ types: "public_channel,private_channel" });
      const existingChannel = list.channels?.find((c) => c.name === channelName);
      if (!existingChannel) throw new Error("Slack channel exists but not found");

      // Get latest message timestamp to use as thread_ts
      const history = await slack.conversations.history({
        channel: existingChannel.id,
        limit: 1,
      });
      const latestTs = history.messages?.[0]?.ts || null;

      return { channelId: existingChannel.id, ts: latestTs };
    }
    throw err;
  }
}






export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // ✅ Initialize Socket.IO before Slack events
  const io = new SocketIOServer(httpServer, {
    cors: { origin: "*", methods: ["GET", "POST"] },
    path: "/socket.io",
  });

  // ✅ Slack events route (can now access io)
  // ✅ Slack events route (can now access io)
  app.post("/api/slack/events", async (req, res) => {
    //   console.log("📥 Incoming Slack event:", JSON.stringify(req.body));

    const { type, challenge, event } = req.body;

    // Handle Slack URL verification
    if (type === "url_verification") {
      console.log("🔑 Slack URL verification request received");
      return res.status(200).send({ challenge });
    }
    console.log("🔹 Storage methods available:", Object.keys(storage));

    // Always respond quickly to avoid retries
    res.sendStatus(200);
    console.log("✅ Responded to Slack quickly to prevent retries");

    // Handle actual Slack events
    if (type === "event_callback") {
      console.log("📝 Slack event_callback received");

      if (!event) {
        console.warn("⚠️ Slack event_callback has no event object");
        return;
      }

      console.log("🔹 Event type:", event.type, "Bot ID:", event.bot_id);

      if (event.type === "message" && !event.bot_id) {
        console.log("💬 New Slack message received:", event.text);

        try {
          const channelId = event.channel;
          console.log("🔗 Message channel ID:", channelId);

          // Lookup conversation by Slack channel
          // @ts-ignore (if TypeScript complains)
          const conversation = await (storage as any).getConversationBySlackChannel(channelId);


          if (!conversation) {
            console.warn("⚠️ No conversation mapped for channel:", channelId);
            return;
          }

          console.log("🗂 Conversation found:", conversation.id);

          const messageData = {
            conversationId: conversation.id,
            senderId: event.user,
            senderType: "support",
            senderName: "Slack Admin",
            content: event.text,
            createdAt: new Date(),
          };

          //  Save to DB
          await storage.createMessage(messageData);
          console.log("✅ Slack message saved to DB:", messageData);

          // Forward to frontend via Socket.IO
          io.to(conversation.id).emit("new_message", messageData);
          console.log("📤 Slack message forwarded to frontend:", conversation.id);
        } catch (err) {
          console.error("❌ Error handling Slack message:", err);
        }
      } else {
        console.log("⚠️ Ignored non-message or bot message");
      }
    } else {
      console.log("⚠️ Ignored non-event_callback Slack event:", type);
    }
  });



  // Other REST routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) return res.json(existingUser);

      const user = await storage.createUser(userData);
      res.json(user);
    } catch (err) {
      console.error("Error creating user:", err);
      res.status(400).json({ error: "Failed to create user" });
    }
  });

  app.get("/api/users/:userId/conversations", async (req, res) => {
    try {
      const conversations = await storage.getUserConversations(req.params.userId);
      res.json(conversations);
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.get("/api/conversations/:conversationId/messages", async (req, res) => {
    try {
      //  const messages = await storage.getConversationMessages(req.params.conversationId);
      res.json("messages");
    } catch (err) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // ✅ Set up socket handlers
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join_user", (userId: string) => {
      if (!userId) return;
      socket.join(userId);
    });
    socket.on("start_conversation", async ({ userId, userEmail }) => {
      try {
        // Check if an active conversation exists for this user
        console.log("Starting conversation for userId:", userId, "email:", userEmail);
        let conversation = await storage.getActiveConversationByUser(userId);
        console.log("Active conversation for user:", conversation);

        if (!conversation) {
          // Create new conversation if none exists
          conversation = await storage.createConversation({ userId, status: "active" });

          // Create (or reuse) Slack channel
          const slackInfo = await createSlackChannelForUser(userId, userEmail);

          const convId = conversation?._id?.toString();
          if (!convId) {
            console.error("❌ No conversation ID found after creation");
            socket.emit("error", { message: "Conversation ID missing" });
            return;
          }

          await storage.updateConversation(convId, {
            slackChannelId: slackInfo.channelId,
            slackThreadTs: slackInfo.ts,
          });
        }

        // ✅ Always normalize convId here (works for both new + existing conversation)
        const convId = (conversation as any)._id.toString() || conversation?._id?.toString();
        if (!convId) {
          console.error("❌ No conversation ID found");
          socket.emit("error", { message: "Conversation ID missing" });
          return;
        }

        // Join existing conversation room
        socket.join(convId);

        // Fetch old messages
        //  const messages = await storage.getConversationMessages(convId);
        let messages: any[] = [];

        if (conversation?.slackChannelId && conversation.slackThreadTs) {
          const slackHistory = await slack.conversations.replies({
            channel: conversation.slackChannelId,
            ts: conversation.slackThreadTs,
          });

          messages = slackHistory.messages
            ?.filter(msg => msg.ts)  // only keep messages with ts
            .map(msg => ({
              id: msg.ts!,
              content: msg.text || "",
              senderType: msg.user ? "support" : "ai",
              senderName: msg.user ? "Slack Admin" : "AI Assistant",
              createdAt: new Date(Number(msg.ts!.split(".")[0]) * 1000),
            })) || [];
        }

        const dbMessages = await storage.getConversationMessages(convId);
        // Filter out duplicates if you want, e.g., messages already in Slack
        const combinedMessages = [
          ...messages,
          ...dbMessages.map(msg => ({
            id: msg.id,
            content: msg.content,
            senderType: msg.senderType,
            senderName: msg.senderName,
            createdAt: msg.createdAt,
            metadata: msg.metadata,
            isAI: msg.senderType === "ai",
          }))
        ];
        // Emit normalized conversation
        socket.emit("conversation_started", {
          conversation: { ...conversation, id: convId },
          messages: combinedMessages,
        });
      } catch (err) {
        console.error("Error starting conversation:", err);
        socket.emit("error", { message: "Failed to start conversation" });
      }
    });



    socket.on("send_message", async (data: {
      conversationId: string;
      userId: string;
      userEmail: string;
      content: string;
    }) => {
      console.log("📩 Incoming send_message event:", data);

      try {
        const { conversationId, userId, userEmail, content } = data;

        // ✅ Validation
        if (!conversationId) {
          console.error("❌ send_message missing conversationId");
          socket.emit("error", { message: "conversationId is required" });
          return;
        }
        if (!userId) {
          console.error("❌ send_message missing userId");
          socket.emit("error", { message: "userId is required" });
          return;
        }
        if (!content) {
          console.error("❌ send_message missing content");
          socket.emit("error", { message: "content is required" });
          return;
        }

        // ✅ Save user message in DB
        const userMessage = await storage.createMessage({
          conversationId,
          senderId: userId,
          senderType: "user",
          senderName: "You",
          content,
        });
        //   const userMessage =  {
        //   id: Date.now().toString(),
        //   conversationId,
        //   senderId: userId,
        //   senderType: "user",
        //   senderName: "You",
        //   content,
        // };

        // console.log("✅ Message saved:", userMessage);

        // ✅ Fetch conversation for Slack mapping
        const conversation = await storage.getConversation(conversationId);
        if (!conversation) {
          console.error("❌ Conversation not found:", conversationId);
          return;
        }

        if (conversation.slackChannelId) {
          // ✅ Send message to Slack
          try {
            const slackTs = await sendMessageToSlack({
              text: content,
              conversationId,
              userEmail,
              channelId: conversation.slackChannelId,
              //  threadTs: conversation.slackThreadTs || undefined,
            });

            console.log("📤 Sent to Slack, ts:", slackTs);

            // Save threadTs if first Slack message
            if (slackTs && !conversation.slackThreadTs) {
              await storage.updateConversation(conversationId, {
                slackThreadTs: slackTs,
              });
              console.log("🔗 Slack thread timestamp saved to conversation");
            }
          } catch (slackError) {
            console.error("❌ Failed to send to Slack:", slackError);
          }
        }

        // ✅ Generate AI auto-reply
        try {
          const recentMessages = await storage.getConversationMessages(conversationId);
          const conversationHistory = recentMessages
            .slice(-5)
            .map(msg => `${msg.senderType}: ${msg.content}`);

          const aiResponse = await generateAutoReply(content, conversationHistory);

          console.log("🤖 AI response generated:", aiResponse);

          if (aiResponse.content && aiResponse.confidence > 0.3) {
            // const aiMessage = await storage.createMessage({
            //   conversationId,
            //   senderId: null,
            //   senderType: "ai",
            //   senderName: "AI Assistant",
            //   content: aiResponse.content,
            //   metadata: {
            //     confidence: aiResponse.confidence,
            //     shouldTransferToHuman: aiResponse.shouldTransferToHuman,
            //   },
            // });

            // console.log("✅ AI Message saved:", aiMessage);

            const aiMessage = {
              id: Date.now().toString(),
              conversationId,
              senderId: null,
              senderType: "ai",
              senderName: "AI Assistant",
              content: aiResponse.content,
              createdAt: new Date(),
              isAI: true,
              metadata: {
                confidence: aiResponse.confidence,
                shouldTransferToHuman: aiResponse.shouldTransferToHuman,
              },
            };


            // Emit AI message with slight delay
            setTimeout(() => {
              io.to(conversationId).emit("new_message", {
                id: aiMessage.id,
                content: aiMessage.content,
                senderType: aiMessage.senderType,
                senderName: aiMessage.senderName,
                createdAt: aiMessage.createdAt,
                isAI: true,
                metadata: aiMessage.metadata,
              });
            }, 1000);
          }
        } catch (aiError) {
          console.error("❌ Failed to generate AI response:", aiError);
        }

        // ✅ Emit user message to frontend
        io.to(conversationId).emit("new_message", {
          id: userMessage.id,
          content: userMessage.content,
          senderType: userMessage.senderType,
          senderName: userMessage.senderName,
          createdAt: userMessage.createdAt,
        });

      } catch (error) {
        console.error("❌ Error sending message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

  });

  // Slack handlers (optional)
  const slackHandlers = await setupSlackEventHandlers(io);
  (app as any).slackHandlers = slackHandlers;

  return httpServer;
}
