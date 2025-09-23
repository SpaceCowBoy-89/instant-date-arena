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
          <DialogContent className={cn("w-[95vw] max-w-sm mx-auto", contentClassName)}>
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
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
          "w-full justify-start h-12 text-left",
          destructive && "text-destructive hover:text-destructive",
          className
        )}
        onClick={handleClick}
        style={{
          WebkitTouchCallout: 'none',
          WebkitUserSelect: 'none',
          touchAction: 'manipulation'
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