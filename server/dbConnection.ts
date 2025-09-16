import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || "mongodb://127.0.0.1:27017/chatbridge";

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

mongoose.connect(DATABASE_URL)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

export const db = mongoose.connection;
