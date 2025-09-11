import { Button } from "@/components/ui/button";
import { Headphones, FileText, Download } from "lucide-react";

interface ChatSidebarProps {
  isConnected: boolean;
  sessionInfo: {
    id: string;
    startTime: string;
    messageCount: number;
  };
  connectionStats: {
    latency: number;
    lastPing: string;
  };
}

export function ChatSidebar({ isConnected, sessionInfo, connectionStats }: ChatSidebarProps) {
  return (
    <div className="hidden lg:flex lg:flex-col lg:w-80 bg-card border-r border-border">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
            <Headphones className="text-primary-foreground text-xl" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground" data-testid="text-app-title">
              Support Chat
            </h1>
            <p className="text-sm text-muted-foreground">Get help instantly</p>
          </div>
        </div>
      </div>
      
      {/* Connection Status */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3 mb-4">
          <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 connection-pulse' : 'bg-red-500'}`}></div>
          <span className="text-sm font-medium text-foreground" data-testid="status-connection-label">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div className="text-xs text-muted-foreground space-y-1">
          <div data-testid="status-socket">
            {isConnected ? 'Socket.IO Connected' : 'Socket.IO Disconnected'}
          </div>
          <div data-testid="status-latency">Latency: {connectionStats.latency}ms</div>
          <div data-testid="status-last-ping">Last ping: {connectionStats.lastPing}</div>
        </div>
      </div>
      
      {/* Chat Information */}
      <div className="p-6">
        <h3 className="text-sm font-medium text-foreground mb-3">Chat Information</h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Session ID:</span>
            <span className="font-mono text-xs" data-testid="text-session-id">
              {sessionInfo.id}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Started:</span>
            <span data-testid="text-start-time">{sessionInfo.startTime}</span>
          </div>
          <div className="flex justify-between">
            <span>Messages:</span>
            <span data-testid="text-message-count">{sessionInfo.messageCount}</span>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      <div className="p-6 mt-auto border-t border-border">
        <h3 className="text-sm font-medium text-foreground mb-3">Quick Actions</h3>
        <div className="space-y-2">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-sm text-muted-foreground hover:text-accent-foreground"
            data-testid="button-chat-history"
          >
            <FileText className="mr-2 h-4 w-4" />
            View Chat History
          </Button>
          <Button 
            variant="ghost" 
            className="w-full justify-start text-sm text-muted-foreground hover:text-accent-foreground"
            data-testid="button-export"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Conversation
          </Button>
        </div>
      </div>
    </div>
  );
}
