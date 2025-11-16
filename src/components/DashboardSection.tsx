import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DashboardSectionProps {
  children: ReactNode;
  title?: string;
  description?: string;
  showSeparator?: boolean;
  className?: string;
  headerClassName?: string;
}

export function DashboardSection({
  children,
  title,
  description,
  showSeparator = false,
  className,
  headerClassName,
}: DashboardSectionProps) {
  return (
    <>
      {showSeparator && <div className="border-t border-border/40 my-6" />}
      
      <div className={cn("mb-6", className)}>
        {(title || description) && (
          <div className={cn("mb-6", headerClassName)}>
            {title && (
              <h2 className="text-3xl font-bold text-foreground mb-2">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-muted-foreground">{description}</p>
            )}
          </div>
        )}
        {children}
      </div>
    </>
  );
}
