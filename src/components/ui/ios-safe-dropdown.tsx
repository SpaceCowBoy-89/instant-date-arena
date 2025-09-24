import * as React from "react";
import { Capacitor } from "@capacitor/core";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface IOSSafeDropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  title?: string;
  align?: "start" | "center" | "end";
  className?: string;
  contentClassName?: string;
  triggerClassName?: string;
}

interface IOSSafeDropdownItemProps {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
  destructive?: boolean;
}

export const IOSSafeDropdown = ({
  trigger,
  children,
  title = "Options",
  align = "end",
  className,
  contentClassName,
  triggerClassName
}: IOSSafeDropdownProps) => {
  const [open, setOpen] = React.useState(false);

  if (Capacitor.isNativePlatform()) {
    return (
      <>
        <div
          onClick={() => setOpen(true)}
          className={cn("inline-flex", triggerClassName)}
          style={{
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
            touchAction: 'manipulation'
          }}
        >
          {trigger}
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className={cn(
            "w-[95vw] max-w-sm mx-auto rounded-3xl border-0",
            "bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl shadow-2xl",
            "animate-in slide-in-from-bottom-4 duration-300",
            contentClassName
          )}>
            <DialogHeader className="relative pb-2">
              <DialogTitle className="text-center font-semibold text-lg text-gray-900 dark:text-gray-100">
                {title}
              </DialogTitle>
              <button
                onClick={() => setOpen(false)}
                className="absolute right-0 top-0 p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                style={{ minHeight: '44px', minWidth: '44px' }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </DialogHeader>
            <div className="space-y-1 pb-2">
              {React.Children.map(children, (child) =>
                React.isValidElement(child) ? React.cloneElement(child, { onClose: () => setOpen(false) } as any) : child
              )}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild className={triggerClassName}>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        className={cn("z-50", className)}
      >
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const IOSSafeDropdownItem = ({
  onClick,
  children,
  className,
  destructive = false,
  onClose,
  ...props
}: IOSSafeDropdownItemProps & { onClose?: () => void }) => {
  const handleClick = () => {
    onClick?.();
    onClose?.();
  };

  if (Capacitor.isNativePlatform()) {
    return (
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start h-14 text-left rounded-2xl mx-2 mb-1",
          "bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700",
          "border border-gray-200/50 dark:border-gray-700/50",
          "transition-all duration-200 active:scale-[0.98]",
          destructive && "text-destructive hover:text-destructive bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
          className
        )}
        onClick={handleClick}
        style={{
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'manipulation',
          minHeight: '56px', // 14 * 4px = 56px for better touch targets
          minWidth: '44px'
        }}
        {...props}
      >
        {children}
      </Button>
    );
  }

  return (
    <DropdownMenuItem
      onClick={onClick}
      className={cn(
        destructive && "text-destructive focus:text-destructive",
        className
      )}
      {...props}
    >
      {children}
    </DropdownMenuItem>
  );
};