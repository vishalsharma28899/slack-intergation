 


import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

const conversationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    topic: { type: String },

    // 🔹 Slack integration fields
    slackChannelId: { type: String, index: true }, // for channel-based mapping
    slackThreadTs: { type: String },               // fallback if using thread mapping
  },
  { timestamps: true }
);

const messageSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
    senderId: { type: String },
    senderType: { type: String, enum: ["user", "support", "ai"], required: true },
    senderName: { type: String },
    content: { type: String, required: true },
    metadata: { type: Object },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
export const Conversation = mongoose.model("Conversation", conversationSchema);
export const Message = mongoose.model("Message", messageSchema);
 export const db = mongoose.connection;