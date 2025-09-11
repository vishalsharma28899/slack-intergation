import { useState, useEffect } from "react";
import { useSocket } from "@/hooks/use-socket";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { ChatHeader } from "@/components/chat/chat-header";
import { MessageList } from "@/components/chat/message-list";
import { MessageInput } from "@/components/chat/message-input";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";

export default function ChatPage() {
  const [userInfo, setUserInfo] = useState<{ id: string; email: string; username: string } | null>(null);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    isConnected,
    messages,
    currentConversation,
    isTyping,
    sendMessage,
    startConversation,
    startTyping,
    stopTyping,
  } = useSocket();

  // Initialize user or show login form
  useEffect(() => {
    const savedUserId = localStorage.getItem('userId');
    const savedEmail = localStorage.getItem('userEmail');
    const savedUsername = localStorage.getItem('username');

    if (savedUserId && savedEmail && savedUsername) {
      setUserInfo({ id: savedUserId, email: savedEmail, username: savedUsername });
    }
  }, []);

const handleStartChat = async () => {
  if (!email.trim() || !username.trim()) return;

  setIsLoading(true);
  try {
    console.log("Starting chat with:", { email, username });

    // Create or get user
    const response = await apiRequest('POST', '/api/users', {
      email: email.trim(),
      username: username.trim(),
    });

    const userData = await response.json();
    console.log("User response from backend:", userData);

    // Use _id from Mongo
    localStorage.setItem('userId', userData._id);
    localStorage.setItem('userEmail', userData.email);
    localStorage.setItem('username', userData.username);

    setUserInfo(userData);
    
    console.log("Starting conversation for userId:", userData._id, "userEmail:", userData.email);
    startConversation(userData._id, userData.email);
  } catch (error) {
    console.error('Failed to start chat:', error);
  } finally {
    setIsLoading(false);
  }
};



  // Mock data for sidebar
  const sessionInfo = {
    id: currentConversation?.id || '#CHT-2024-001',
    startTime: currentConversation?.createdAt 
      ? new Date(currentConversation.createdAt).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      : new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
    messageCount: messages.length,
  };

  const connectionStats = {
    latency: 45,
    lastPing: '2s ago',
  };

  // Show login form if user not authenticated
  if (!userInfo || !currentConversation) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center" data-testid="text-welcome-title">
              Welcome to Support Chat
            </CardTitle>
            <p className="text-center text-muted-foreground">
              Please enter your details to start chatting with our support team
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Name</Label>
              <Input
                id="username"
                type="text"
                placeholder="Your name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                data-testid="input-username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                data-testid="input-email"
              />
            </div>
            <Button 
              onClick={handleStartChat}
              className="w-full"
              disabled={!email.trim() || !username.trim() || isLoading}
              data-testid="button-start-chat"
            >
              {isLoading ? 'Starting Chat...' : 'Start Chat'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background" data-testid="chat-application">
      <ChatSidebar
        isConnected={isConnected}
        sessionInfo={sessionInfo}
        connectionStats={connectionStats}
      />
      
      <div className="flex-1 flex flex-col">
        <ChatHeader />
        <MessageList messages={messages} isTyping={isTyping} />
        <MessageInput
          onSendMessage={sendMessage}
          onStartTyping={startTyping}
          onStopTyping={stopTyping}
          isConnected={isConnected}
        />
      </div>
    </div>
  );
}
