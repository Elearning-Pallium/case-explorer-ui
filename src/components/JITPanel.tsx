import { useState, useEffect, useRef } from "react";
import { X, BookOpen, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import type { JITResource } from "@/lib/content-schema";
import { analyticsTrackJIT } from "@/lib/analytics-service";

interface JITPanelProps {
  resource: JITResource;
  isOpen: boolean;
  isCompleted: boolean;
  onComplete: () => void;
  onClose: () => void;
  caseId?: string;
}

export function JITPanel({
  resource,
  isOpen,
  isCompleted,
  onComplete,
  onClose,
  caseId = "",
}: JITPanelProps) {
  // Track when JIT was opened for duration calculation
  const openTimeRef = useRef<number | null>(null);
  
  // Set open time when panel opens
  useEffect(() => {
    if (isOpen && !openTimeRef.current) {
      openTimeRef.current = Date.now();
    } else if (!isOpen) {
      openTimeRef.current = null;
    }
  }, [isOpen]);

  const handleMarkComplete = () => {
    if (!isCompleted) {
      // Track JIT completion with duration
      const durationSeconds = openTimeRef.current 
        ? Math.round((Date.now() - openTimeRef.current) / 1000)
        : 0;
      
      analyticsTrackJIT(
        caseId,
        resource.id,
        resource.title,
        durationSeconds,
        resource.points
      );
      
      onComplete();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader className="border-b pb-4">
          <div className="flex items-center gap-2 text-accent">
            <BookOpen className="h-5 w-5" />
            <span className="text-xs font-medium uppercase tracking-wider">
              Additional Resource
            </span>
          </div>
          <SheetTitle className="text-xl">{resource.title}</SheetTitle>
          <SheetDescription className="sr-only">
            Additional resource about {resource.title}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 py-6">
          <div className="space-y-4 pr-4">
            <p className="text-muted-foreground leading-relaxed">
              {resource.summary}
            </p>
            {resource.content && (
              <div className="prose prose-sm dark:prose-invert">
                <p className="text-foreground leading-relaxed">
                  {resource.content}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t pt-4 mt-auto">
          {isCompleted ? (
            <div className="flex items-center justify-center gap-2 text-success py-2">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">Completed!</span>
            </div>
          ) : (
            <Button
              onClick={handleMarkComplete}
              className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              Mark as Read (+{resource.points} pts)
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
