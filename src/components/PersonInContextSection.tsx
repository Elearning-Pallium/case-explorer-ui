import type { PersonInContext, OpeningScene, PatientPerspective, PatientBaseline } from "@/lib/content-schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, BookOpen, MessageCircle, ClipboardList } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface PersonInContextSectionProps {
  personInContext: PersonInContext;
  openingScene: OpeningScene;
  patientPerspective?: PatientPerspective;
  patientBaseline: PatientBaseline;
  patientName: string;
}

export function PersonInContextSection({ 
  personInContext, 
  openingScene, 
  patientPerspective,
  patientBaseline,
  patientName 
}: PersonInContextSectionProps) {
  return (
    <div className="rounded-xl border bg-card shadow-soft overflow-hidden">
      <Tabs defaultValue="baseline" className="w-full">
        <TabsList className="w-full justify-start rounded-none border-b bg-muted/50 p-0 h-auto flex-wrap">
          <TabsTrigger 
            value="baseline" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
          >
            <ClipboardList className="h-4 w-4 mr-2" />
            Patient Baseline
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
          <TabsTrigger 
            value="scene" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Scene
          </TabsTrigger>
        </TabsList>

        {/* Patient Baseline Tab */}
        <TabsContent value="baseline" className="mt-0 p-6">
          <div className="space-y-6">
            {/* Patient & Living Situation */}
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="font-semibold text-foreground">Patient:</span>
                <span className="text-foreground">{patientBaseline.name}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-semibold text-foreground">Living situation:</span>
                <span className="text-foreground">{patientBaseline.livingSituation}</span>
              </div>
            </div>

            <Separator />

            {/* Diagnosis / Illness Context */}
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">Diagnosis / Illness Context</h4>
              <div className="pl-4 space-y-1 text-foreground/90">
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground">Primary diagnosis:</span>
                  <span>{patientBaseline.diagnosis}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground">Broad disease state:</span>
                  <span>Recurrent</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Care Context */}
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">Care Context</h4>
              <div className="pl-4 space-y-1 text-foreground/90">
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground">Current involved services:</span>
                  <span>{patientBaseline.additionalInfo?.["Care Context"] ? "Oncology; home care" : "Not documented"}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Treatment History */}
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">Treatment History (High-Level)</h4>
              <div className="pl-4 text-foreground/90">
                <span>Receiving disease-focused care through oncology</span>
              </div>
            </div>

            <Separator />

            {/* Medications */}
            <div className="space-y-2">
              <h4 className="font-semibold text-foreground">Medications</h4>
              <div className="pl-4 text-foreground/90">
                <span>Medications: None listed in chart.</span>
              </div>
            </div>
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
      </Tabs>
    </div>
  );
}
