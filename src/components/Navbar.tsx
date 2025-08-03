import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, User, Settings, Users } from "lucide-react";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border z-50 pb-safe">
      <div className="flex items-center justify-around py-2 px-1 max-w-md mx-auto" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <Button
          variant={isActive("/lobby") ? "default" : "ghost"}
          size="sm"
          className="flex flex-col items-center gap-0.5 h-auto py-1.5 px-0.5 min-w-0 flex-1"
          onClick={() => navigate("/lobby")}
        >
          <Heart className="h-4 w-4 flex-shrink-0" />
          <span className="text-[10px] leading-tight text-center truncate w-full">
            <span className="hidden xs:inline">Speed Date</span>
            <span className="xs:hidden">Date</span>
          </span>
        </Button>

        <Button
          variant={isActive("/communities") ? "default" : "ghost"}
          size="sm"
          className="flex flex-col items-center gap-0.5 h-auto py-1.5 px-0.5 min-w-0 flex-1"
          onClick={() => navigate("/communities")}
        >
          <Users className="h-4 w-4 flex-shrink-0" />
          <span className="text-[10px] leading-tight text-center truncate w-full">
            Communities
          </span>
        </Button>

        <Button
          variant={isActive("/messages") ? "default" : "ghost"}
          size="sm"
          className="flex flex-col items-center gap-0.5 h-auto py-1.5 px-0.5 min-w-0 flex-1"
          onClick={() => navigate("/messages")}
        >
          <MessageCircle className="h-4 w-4 flex-shrink-0" />
          <span className="text-[10px] leading-tight text-center truncate w-full">Messages</span>
        </Button>

        <Button
          variant={isActive("/profile") ? "default" : "ghost"}
          size="sm"
          className="flex flex-col items-center gap-0.5 h-auto py-1.5 px-0.5 min-w-0 flex-1"
          onClick={() => navigate("/profile")}
        >
          <User className="h-4 w-4 flex-shrink-0" />
          <span className="text-[10px] leading-tight text-center truncate w-full">Profile</span>
        </Button>

        <Button
          variant={isActive("/settings") ? "default" : "ghost"}
          size="sm"
          className="flex flex-col items-center gap-0.5 h-auto py-1.5 px-0.5 min-w-0 flex-1"
          onClick={() => navigate("/settings")}
        >
          <Settings className="h-4 w-4 flex-shrink-0" />
          <span className="text-[10px] leading-tight text-center truncate w-full">Settings</span>
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;