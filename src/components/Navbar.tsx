import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, User, Settings, Users } from "lucide-react";
import { memo, useCallback } from "react";

// Configuration for navigation items
const navItems = [
  { path: "/date", label: "Date", icon: Heart },
  { path: "/communities", label: "Communities", icon: Users },
  { path: "/messages", label: "Messages", icon: MessageCircle, hasNotification: false },
  { path: "/profile", label: "Profile", icon: User },
  { path: "/settings", label: "Settings", icon: Settings },
];

// Function to get unread messages count (will be 0 for now)
const getUnreadMessagesCount = () => 0; // No unread messages

const Navbar = memo(() => {
  const navigate = useNavigate();
  const location = useLocation();

  // Memoize isActive function
  const isActive = useCallback((path: string) => location.pathname === path, [location.pathname]);

  return (
    <nav className="step-navbar fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border z-50 pb-safe">
      <div
        className="flex items-center justify-around py-2 px-1 max-w-md mx-auto"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {navItems.map(({ path, label, icon: Icon, hasNotification }) => (
          <Button
            key={path}
            variant={isActive(path) ? "default" : "ghost"}
            size="sm"
            className={`
              flex flex-col items-center gap-1 h-auto py-3 px-2 min-w-0 flex-1 min-h-[56px] touch-target
              transition-transform duration-200 ease-in-out hover:scale-105
              ${isActive(path) ? "bg-gradient-to-b from-primary to-primary/80 shadow-md" : ""}
            `}
            onClick={() => navigate(path)}
            aria-label={`Navigate to ${label}`}
            aria-current={isActive(path) ? "page" : undefined}
            tabIndex={0} // Ensure keyboard accessibility
          >
            <div className="relative">
              <Icon className="h-5 w-5 flex-shrink-0" />
              {hasNotification && getUnreadMessagesCount() > 0 && (
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
              )}
            </div>
            <span className="text-xs font-medium leading-tight text-center truncate w-full">{label}</span>
          </Button>
        ))}
      </div>
    </nav>
  );
});

export default Navbar;