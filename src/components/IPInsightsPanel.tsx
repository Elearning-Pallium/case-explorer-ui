import { useState } from "react";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { IPPerspective } from "@/lib/content-schema";

interface IPInsightsPanelProps {
  perspectives: IPPerspective[];
}

export function IPInsightsPanel({ perspectives }: IPInsightsPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <div
      className={cn(
        "flex flex-col border-l bg-card transition-all duration-300",
        isCollapsed ? "w-12" : "w-80"
      )}
    >
      {/* Header with toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="flex h-12 items-center gap-2 border-b px-3 hover:bg-muted/50 transition-colors"
      >
        {isCollapsed ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-accent" />
            <span className="font-medium text-sm">Interprofessional Insights</span>
          </div>
        )}
        {isCollapsed && <Users className="h-4 w-4 text-accent" />}
      </button>

      {/* Content area */}
      {!isCollapsed && (
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {perspectives.map((perspective) => (
              <div
                key={perspective.id}
                className="rounded-lg border bg-background p-4 shadow-soft"
              >
                {/* Avatar and Title */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-14 w-14 rounded-full overflow-hidden bg-secondary shrink-0">
                    {perspective.imageUrl ? (
                      <img
                        src={perspective.imageUrl}
                        alt={perspective.title}
                        className="h-full w-full object-cover object-top"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                        <Users className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{perspective.title}</h4>
                    <span className="text-xs text-muted-foreground capitalize">
                      {perspective.role.replace("_", " ")}
                    </span>
                  </div>
                </div>

                {/* Perspective text */}
                <p className="text-sm leading-relaxed text-foreground/90">
                  {perspective.perspective}
                </p>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Collapsed state - vertical text indicator */}
      {isCollapsed && (
        <div className="flex-1 flex items-center justify-center">
          <span
            className="text-xs text-muted-foreground font-medium"
            style={{
              writingMode: "vertical-rl",
              textOrientation: "mixed",
              transform: "rotate(180deg)",
            }}
          >
            IP Insights
          </span>
        </div>
      )}
    </div>
  );
}
