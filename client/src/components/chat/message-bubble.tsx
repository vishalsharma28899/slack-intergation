import { cn } from "@/lib/utils";
import { CheckCheck, Bot, Bus, User } from "lucide-react";

interface MessageBubbleProps {
  content: string;
  senderType: 'user' | 'support' | 'ai';
  senderName: string;
  timestamp: string;
  isAI?: boolean;
  isFromSlack?: boolean;
  metadata?: any;
}

export function MessageBubble({ 
  content, 
  senderType, 
  senderName, 
  timestamp, 
  isAI = false,
  isFromSlack = false,
  metadata 
}: MessageBubbleProps) {
  const isUser = senderType === 'user';
  const isSupport = senderType === 'support';
  const isAIAssistant = senderType === 'ai' || isAI;

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className={cn(
      "flex items-start space-x-3",
      isUser && "justify-end"
    )} data-testid={`message-${senderType}`}>
      {!isUser && (
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
          isAIAssistant ? "bg-gradient-to-br from-purple-500 to-blue-500" : "bg-primary"
        )}>
          {isAIAssistant ? (
            <Bot className="text-white text-sm" size={16} />
          ) : (
            <Bus className="text-primary-foreground text-sm" size={16} />
          )}
        </div>
      )}
      
      <div className="flex-1 max-w-xs lg:max-w-md">
        <div className={cn(
          "rounded-lg px-4 py-3 shadow-sm",
          isUser 
            ? "message-bubble-user text-right" 
            : "message-bubble-support",
          isAIAssistant && "border-l-4 border-l-purple-500"
        )}>
          {isAIAssistant && (
            <div className="flex items-center space-x-2 mb-2">
              <Bot className="text-purple-500" size={12} />
              <span className="text-xs font-medium text-purple-600">AI Assistant</span>
            </div>
          )}
          <p className={cn(
            "text-sm",
            isUser ? "text-primary-foreground" : "text-foreground"
          )} data-testid="message-content">
            {content}
          </p>
        </div>
        
        <div className={cn(
          "flex items-center space-x-2 mt-1",
          isUser ? "justify-end" : "justify-start"
        )}>
          {!isUser && (
            <>
              <span className="text-xs text-muted-foreground" data-testid="sender-name">
                {senderName}
              </span>
              <span className="text-xs text-muted-foreground" data-testid="message-timestamp">
                {formatTime(timestamp)}
              </span>
              <CheckCheck className="text-green-500" size={12} />
              {isFromSlack && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  via Slack
                </span>
              )}
            </>
          )}
          {isUser && (
            <>
              <CheckCheck className="text-green-500" size={12} />
              <span className="text-xs text-muted-foreground" data-testid="message-timestamp">
                {formatTime(timestamp)}
              </span>
              <span className="text-xs text-muted-foreground" data-testid="sender-name">
                {senderName}
              </span>
            </>
          )}
        </div>
      </div>

      {isUser && (
        <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
          <User className="text-accent-foreground text-sm" size={16} />
        </div>
      )}
    </div>
  );
}
