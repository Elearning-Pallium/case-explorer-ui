import { useState } from "react";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { IPPerspective } from "@/lib/content-schema";

interface IPInsightsPanelProps {
  perspectives: IPPerspective[];
}

const getImagePosition = (role: string) => {
  switch (role) {
    case "care_aide":
    case "wound_specialist":
      return "object-center";
    default:
      return "object-top";
  }
};

export function IPInsightsPanel({ perspectives }: IPInsightsPanelProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative flex flex-col border-l bg-card transition-all duration-300",
        isCollapsed ? "w-12" : "w-80"
      )}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -left-3 top-4 z-10 flex h-6 w-6 items-center justify-center rounded-full border bg-card shadow-sm hover:bg-secondary transition-colors"
        aria-label={isCollapsed ? "Expand IP insights" : "Collapse IP insights"}
      >
        {isCollapsed ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>

      {/* Header */}
      <div className={cn(
        "flex items-center gap-2 border-b p-3",
        isCollapsed && "justify-center"
      )}>
        <Users className="h-5 w-5 text-primary" />
        {!isCollapsed && (
          <h3 className="font-semibold text-primary">Interprofessional Insights</h3>
        )}
      </div>

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
                        className={cn("h-full w-full object-cover", getImagePosition(perspective.role))}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                        <Users className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm">{perspective.title}</h4>
                    {perspective.role === "mrp" && (
                      <span className="text-xs text-muted-foreground">
                        (e.g., physician or nurse practitioner)
                      </span>
                    )}
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
    </aside>
  );
}
