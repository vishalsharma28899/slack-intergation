import { useState, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Smile, Image, Send } from "lucide-react";

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  onStartTyping: () => void;
  onStopTyping: () => void;
  isConnected: boolean;
}

export function MessageInput({ 
  onSendMessage, 
  onStartTyping, 
  onStopTyping, 
  isConnected 
}: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = () => {
    if (message.trim() && isConnected) {
      onSendMessage(message.trim());
      setMessage("");
      if (isTyping) {
        onStopTyping();
        setIsTyping(false);
      }
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (value: string) => {
    setMessage(value);
    
    // Handle typing indicators
    if (value.length > 0 && !isTyping) {
      onStartTyping();
      setIsTyping(true);
    } else if (value.length === 0 && isTyping) {
      onStopTyping();
      setIsTyping(false);
    }
  };

  return (
    <div className="border-t border-border bg-card p-4 lg:p-6">
      <div className="flex items-end space-x-3">
        <Button 
          variant="ghost" 
          size="icon"
          className="flex-shrink-0" 
          title="Attach File"
          data-testid="button-attach"
        >
          <Paperclip className="h-4 w-4" />
        </Button>
        
        <div className="flex-1 relative">
          <div className="bg-background border border-border rounded-lg">
            <Textarea
              value={message}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="border-0 resize-none focus-visible:ring-0 text-sm min-h-[44px] max-h-[120px]"
              rows={1}
              data-testid="input-message"
            />
            
            <div className="px-3 pb-2 flex justify-between items-center">
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <span data-testid="text-character-count">{message.length}/2000</span>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-6 w-6 p-0" 
                  title="Emoji"
                  data-testid="button-emoji"
                >
                  <Smile className="h-3 w-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-6 w-6 p-0" 
                  title="GIF"
                  data-testid="button-gif"
                >
                  <Image className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <Button 
          onClick={handleSendMessage}
          disabled={!message.trim() || !isConnected}
          className="flex-shrink-0"
          title="Send Message"
          data-testid="button-send"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Connection Status Bar */}
      <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span data-testid="status-connection">
            {isConnected ? 'Connected to support' : 'Disconnected'}
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <span>Encrypted • Socket.IO</span>
          <span data-testid="status-activity">Last activity: Now</span>
        </div>
      </div>
    </div>
  );
}
