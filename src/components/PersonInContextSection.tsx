import type { PersonInContext, OpeningScene } from "@/lib/content-schema";
import { User } from "lucide-react";

interface PersonInContextSectionProps {
  personInContext: PersonInContext;
  openingScene: OpeningScene;
}

export function PersonInContextSection({ personInContext, openingScene }: PersonInContextSectionProps) {
  return (
    <div className="space-y-8">
      {/* Person in Context */}
      <section className="rounded-xl border bg-card p-6 shadow-soft">
        <h2 className="text-xl font-semibold mb-4 text-primary flex items-center gap-2">
          <User className="h-5 w-5" />
          {personInContext.title}
        </h2>
        
        <div className="flex flex-col md:flex-row gap-6">
          {/* Image */}
          {personInContext.imageUrl && (
            <div className="shrink-0">
              <div className="relative w-full md:w-48 h-48 rounded-lg overflow-hidden bg-secondary">
                <img
                  src={personInContext.imageUrl}
                  alt={personInContext.imageAlt || personInContext.title}
                  className="w-full h-full object-cover"
                />
              </div>
              {personInContext.caption && (
                <p className="mt-2 text-sm text-muted-foreground italic text-center">
                  {personInContext.caption}
                </p>
              )}
            </div>
          )}
          
          {/* Narrative */}
          <div className="flex-1">
            <p className="text-foreground leading-relaxed">
              {personInContext.narrative}
            </p>
          </div>
        </div>
      </section>

      {/* Opening Scene */}
      <section className="rounded-xl border-l-4 border-accent bg-highlight p-6">
        <h3 className="text-lg font-semibold mb-3 text-highlight-foreground">
          The Scene
        </h3>
        
        <p className="text-foreground leading-relaxed mb-4">
          {openingScene.narrative}
        </p>

        {/* Media if present */}
        {openingScene.mediaType !== "none" && openingScene.mediaUrl && (
          <div className="mt-4 rounded-lg overflow-hidden">
            {openingScene.mediaType === "image" ? (
              <div>
                <img
                  src={openingScene.mediaUrl}
                  alt={openingScene.mediaAlt || "Scene illustration"}
                  className="w-full h-auto max-h-64 object-cover"
                />
                {openingScene.mediaCaption && (
                  <p className="mt-2 text-sm text-muted-foreground italic">
                    {openingScene.mediaCaption}
                  </p>
                )}
              </div>
            ) : (
              <video
                src={openingScene.mediaUrl}
                controls
                className="w-full"
              />
            )}
          </div>
        )}
      </section>
    </div>
  );
}
