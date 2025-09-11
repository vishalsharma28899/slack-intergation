import { Button } from "@/components/ui/button";
import { Menu, Phone, Video, MoreVertical, Bus } from "lucide-react";

interface ChatHeaderProps {
  onToggleSidebar?: () => void;
}

export function ChatHeader({ onToggleSidebar }: ChatHeaderProps) {
  return (
    <header className="bg-card border-b border-border px-4 py-4 lg:px-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button 
            variant="ghost" 
            size="icon"
            className="lg:hidden" 
            onClick={onToggleSidebar}
            data-testid="button-menu"
          >
            <Menu className="h-4 w-4" />
          </Button>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Bus className="text-primary-foreground" size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-foreground" data-testid="text-support-team">Support Team</h2>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-muted-foreground" data-testid="status-online">
                  Online • Avg response: 2 min
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="icon"
            title="Voice Call"
            data-testid="button-voice-call"
          >
            <Phone className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            title="Video Call"
            data-testid="button-video-call"
          >
            <Video className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            title="More Options"
            data-testid="button-more"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
