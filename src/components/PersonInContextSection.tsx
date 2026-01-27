import type { PersonInContext, OpeningScene, PatientPerspective } from "@/lib/content-schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, BookOpen, MessageCircle } from "lucide-react";

interface PersonInContextSectionProps {
  personInContext: PersonInContext;
  openingScene: OpeningScene;
  patientPerspective?: PatientPerspective;
  patientName: string;
}

export function PersonInContextSection({ 
  personInContext, 
  openingScene, 
  patientPerspective,
  patientName 
}: PersonInContextSectionProps) {
  return (
    <div className="rounded-xl border bg-card shadow-soft overflow-hidden">
      <Tabs defaultValue="scene" className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b bg-muted/50 p-0 h-auto">
          <TabsTrigger 
            value="scene" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Scene
          </TabsTrigger>
          <TabsTrigger 
            value="about" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
          >
            <User className="h-4 w-4 mr-2" />
            About {patientName}
          </TabsTrigger>
          {patientPerspective && (
            <TabsTrigger 
              value="perspective" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
            >
            <MessageCircle className="h-4 w-4 mr-2" />
            {patientName} Speaks
            </TabsTrigger>
          )}
        </TabsList>

        {/* Scene Tab */}
        <TabsContent value="scene" className="mt-0 p-6">
          <div className="border-l-4 border-accent bg-highlight/50 p-6 rounded-r-lg">
            <p className="text-foreground leading-relaxed whitespace-pre-line">
              {openingScene.narrative}
            </p>

            {/* Media if present */}
            {openingScene.mediaType !== "none" && openingScene.mediaUrl && (
              <div className="mt-6 rounded-lg overflow-hidden">
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
          </div>
        </TabsContent>

        {/* About Patient Tab */}
        <TabsContent value="about" className="mt-0 p-6">
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
              <p className="text-foreground leading-relaxed whitespace-pre-line">
                {personInContext.narrative}
              </p>
            </div>
          </div>
        </TabsContent>

        {/* Patient's Perspective Tab */}
        {patientPerspective && (
          <TabsContent value="perspective" className="mt-0 p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Patient Image */}
              {patientPerspective.imageUrl && (
                <div className="shrink-0">
                  <div className="relative w-full md:w-56 h-56 rounded-lg overflow-hidden bg-secondary">
                    <img
                      src={patientPerspective.imageUrl}
                      alt={patientPerspective.imageAlt || `${patientName}'s perspective`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {patientPerspective.caption && (
                    <p className="mt-2 text-sm text-muted-foreground italic text-center">
                      {patientPerspective.caption}
                    </p>
                  )}
                </div>
              )}
              
              {/* First-Person Narrative */}
              <div className="flex-1">
                <div className="relative">
                  {/* Opening quote mark */}
                  <span className="absolute -top-4 -left-2 text-6xl text-primary/20 font-serif leading-none">
                    "
                  </span>
                  <blockquote className="pl-6 italic text-foreground leading-relaxed whitespace-pre-line">
                    {patientPerspective.narrative}
                  </blockquote>
                  {/* Closing attribution */}
                  <p className="mt-4 text-sm text-muted-foreground text-right">
                    — {patientName}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
