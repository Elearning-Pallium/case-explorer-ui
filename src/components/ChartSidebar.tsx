import { useState } from "react";
import { ChevronLeft, ChevronRight, FileText, Image, Clock } from "lucide-react";
import type { ChartEntry } from "@/lib/content-schema";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ChartSidebarProps {
  entries: ChartEntry[];
  revealedCount?: number; // How many entries to show (progressive reveal)
}

export function ChartSidebar({ entries, revealedCount = entries.length }: ChartSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const visibleEntries = entries.slice(0, revealedCount);

  const getEntryIcon = (renderType: ChartEntry["renderType"]) => {
    switch (renderType) {
      case "image":
        return <Image className="h-4 w-4" />;
      case "hybrid":
        return <FileText className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <aside
      className={cn(
        "relative flex flex-col border-r bg-card transition-all duration-300",
        isCollapsed ? "w-12" : "w-80"
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-4 z-10 flex h-6 w-6 items-center justify-center rounded-full border bg-card shadow-sm hover:bg-secondary transition-colors"
        aria-label={isCollapsed ? "Expand chart notes" : "Collapse chart notes"}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>

      {/* Header */}
      <div className={cn(
        "flex items-center gap-2 border-b p-3",
        isCollapsed && "justify-center"
      )}>
        <FileText className="h-5 w-5 text-primary" />
        {!isCollapsed && (
          <h3 className="font-semibold text-primary">Chart Notes</h3>
        )}
      </div>

      {/* Entries */}
      <ScrollArea className="flex-1">
        <div className={cn("p-2", isCollapsed && "px-1")}>
          {visibleEntries.map((entry, index) => (
            <div
              key={entry.id}
              className={cn(
                "mb-2 rounded-lg border bg-card p-3 shadow-sm transition-all animate-slide-up",
                isCollapsed && "p-2"
              )}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {isCollapsed ? (
                <div className="flex justify-center" title={entry.title}>
                  {getEntryIcon(entry.renderType)}
                </div>
              ) : (
                <>
                  {/* Timestamp */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                    <Clock className="h-3 w-3" />
                    <span>{entry.timestamp}</span>
                  </div>
                  
                  {/* Title */}
                  <div className="flex items-center gap-2 mb-2">
                    {getEntryIcon(entry.renderType)}
                    <h4 className="font-medium text-sm">{entry.title}</h4>
                  </div>
                  
                  {/* Content */}
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {entry.content}
                  </p>

                  {/* Image if hybrid or image type */}
                  {entry.imageUrl && (
                    <div className="mt-2">
                      <img
                        src={entry.imageUrl}
                        alt={entry.imageAlt || entry.title}
                        className="rounded-md w-full h-auto"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          ))}

          {/* Placeholder for future entries */}
          {revealedCount < entries.length && !isCollapsed && (
            <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
              <span className="italic">More notes will appear as you progress...</span>
            </div>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
