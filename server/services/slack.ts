import { WebClient } from "@slack/web-api";
import { storage } from "../dbQuerys";
import dotenv from "dotenv";
dotenv.config();
const SLACK_API_TOKEN = process.env.SLACK_API_TOKEN;
if (!SLACK_API_TOKEN) {
  throw new Error("SLACK_API_TOKEN environment variable must be set");
}

const slack = new WebClient(SLACK_API_TOKEN);
const SUPPORT_CHANNEL = "#support"; // Default channel for support messages

export interface SlackMessage {
  text: string;
  conversationId: string;
  userEmail: string;
  threadTs?: string;
}

export async function sendMessageToSlack(params: {
  text: string;
  conversationId: string;
  userEmail: string;
  channelId: string;       // 🔹 add this
  threadTs?: string;
}): Promise<string | undefined> {
  try {
    const result = await slack.chat.postMessage({
      channel: params.channelId,  // 🔹 now valid
      text: `💬 Message from *${params.userEmail}*:\n${params.text}`,
      thread_ts: params.threadTs,
    });

    return result.ts;
  } catch (error) {
    console.error("❌ Failed to send message to Slack:", error);
    throw error;
  }
}


export async function setupSlackEventHandlers(io: any) {
  // In a real implementation, you would set up Slack Events API webhooks
  // For now, we'll simulate receiving messages from Slack

  // This would be called by your Slack Events API webhook endpoint
  async function handleSlackMessage(event: any) {
    try {
      if (event.type === 'message' && event.thread_ts && !event.bot_id) {
        // This is a threaded reply from a human agent
        const conversation = await storage.getConversationBySlackThread(event.thread_ts);

        if (conversation) {
          // Save the Slack message to our database
          const message = await storage.createMessage({
            conversationId: conversation.id,
            senderId: null, // No user ID for Slack agents
            senderType: "support",
            senderName: event.user_profile?.display_name || "Support Agent",
            content: event.text,
            isFromSlack: true,
            slackTs: event.ts,
          });

          // Emit to the user via Socket.IO
          io.to(conversation.userId).emit('new_message', {
            id: message.id,
            content: message.content,
            senderType: message.senderType,
            senderName: message.senderName,
            createdAt: message.createdAt,
            isFromSlack: true,
          });
        }
      }
    } catch (error) {
      console.error('Error handling Slack message:', error);
    }
  }

  // Return the handler for webhook setup
  return { handleSlackMessage };
}
