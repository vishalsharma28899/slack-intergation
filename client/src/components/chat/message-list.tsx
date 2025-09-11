import { useEffect, useRef } from "react";
import { MessageBubble } from "./message-bubble";
import { Bus } from "lucide-react";

interface Message {
  id: string;
  content: string;
  senderType: 'user' | 'support' | 'ai';
  senderName: string;
  createdAt: string;
  isAI?: boolean;
  isFromSlack?: boolean;
  metadata?: any;
}

interface MessageListProps {
  messages: Message[];
  isTyping: boolean;
}

export function MessageList({ messages, isTyping }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 scroll-smooth bg-background" data-testid="messages-container">
      {/* Welcome Message */}
      <div className="flex justify-center">
        <div className="bg-card rounded-lg px-4 py-2 border border-border">
          <p className="text-sm text-muted-foreground text-center">
            <i className="fas fa-shield-alt mr-2"></i>
            Chat started • Your conversation is secure and encrypted
          </p>
        </div>
      </div>

      {/* Messages */}
      {messages.map((message, index ) => (
        <MessageBubble
           key={message.id || index}   // ✅ use unique id if available
          content={message.content}
          senderType={message.senderType}
          senderName={message.senderName}
          timestamp={message.createdAt}
          isAI={message.isAI}
          isFromSlack={message.isFromSlack}
          metadata={message.metadata}
        />
      ))}

      {/* Typing Indicator */}
      {isTyping && (
        <div className="flex items-start space-x-3" data-testid="typing-indicator">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
            <Bus className="text-primary-foreground text-sm" size={16} />
          </div>
          <div className="flex-1 max-w-xs lg:max-w-md">
            <div className="message-bubble-support rounded-lg px-4 py-3 shadow-sm">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-muted-foreground rounded-full typing-indicator"></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full typing-indicator"></div>
                <div className="w-2 h-2 bg-muted-foreground rounded-full typing-indicator"></div>
                <span className="ml-2 text-xs text-muted-foreground">Support agent is typing...</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
