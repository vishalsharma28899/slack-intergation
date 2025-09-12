 



import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

interface Message {
  id: string;
  content: string;
  senderType: "user" | "support" | "ai";
  senderName: string;
  createdAt: string;
  isAI?: boolean;
  isFromSlack?: boolean;
  metadata?: any;
}

interface Conversation {
  id: string;
  userId: string;
  status: string;
  createdAt: string;
}

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  messages: Message[];
  currentConversation: Conversation | null;
  isTyping: boolean;
  sendMessage: (content: string) => void;
  startConversation: (userId: string, userEmail: string) => void;
  startTyping: () => void;
  stopTyping: () => void;
}

export function useSocket(): UseSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const socketUrl = `${protocol}//${window.location.host}`;

    socketRef.current = io(socketUrl, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("✅ Connected to server");
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      console.log("❌ Disconnected from server");
      setIsConnected(false);
    });

    // Conversation started
   socket.on(
  "conversation_started",
  (data: { conversation: any; messages: Message[] }) => {
    console.log("🎉 Conversation started:", data);

    const conversationId = data.conversation.id || data.conversation._id;
    if (!conversationId) {
      return console.error("❌ conversation_started missing conversationId");
    }

    const normalizedConversation = { ...data.conversation, id: conversationId };
    setCurrentConversation(normalizedConversation);

    // 👇 instead of single message, set full history
    setMessages(data.messages || []);

    localStorage.setItem("conversationId", conversationId);

    socket.emit("join_conversation", conversationId);
    console.log("✅ Joined conversation room:", conversationId);
  }
);


    // New messages
    socket.on("new_message", (message: Message) => {
      console.log("📨 New message received:", message);
      setMessages(prev => [...prev, message]);
    });

    // Typing indicator
    socket.on("user_typing", (data: { isTyping: boolean }) => {
      setIsTyping(data.isTyping);
    });

    socket.on("error", (error: { message: string }) => {
      console.error("Socket error:", error.message);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Send a new message
  const sendMessage = (content: string) => {
    if (!socketRef.current) return console.error("❌ No socket connection");

    const userId = localStorage.getItem("userId");
    const userEmail = localStorage.getItem("userEmail");
    const conversationId =
      currentConversation?.id || localStorage.getItem("conversationId");

    if (!conversationId) return console.error("❌ Cannot send message — conversationId missing");
    if (!userId) return console.error("❌ Cannot send message — userId missing");

    const payload = { conversationId, userId, userEmail, content };
    console.log("📤 Sending message payload:", payload);
    socketRef.current.emit("send_message", payload);
  };

  // Start a new conversation
  const startConversation = (userId: string, userEmail: string) => {
    if (!socketRef.current) return;

    localStorage.setItem("userId", userId);
    localStorage.setItem("userEmail", userEmail);

    console.log("🚀 Starting conversation with userId:", userId);
    socketRef.current.emit("join_user", userId);
    socketRef.current.emit("start_conversation", { userId, userEmail });
  };

  // Typing events
  const startTyping = () => {
    if (!socketRef.current || !currentConversation) return;
    socketRef.current.emit("typing_start", { conversationId: currentConversation.id });
  };

  const stopTyping = () => {
    if (!socketRef.current || !currentConversation) return;
    socketRef.current.emit("typing_stop", { conversationId: currentConversation.id });
  };

  return {
    socket: socketRef.current,
    isConnected,
    messages,
    currentConversation,
    isTyping,
    sendMessage,
    startConversation,
    startTyping,
    stopTyping,
  };
}
