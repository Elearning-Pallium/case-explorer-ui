import { z } from "zod";

// Schema v1.1 - Palliative Care Case Content Schema

// Chart entry types
export const ChartEntrySchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  title: z.string(),
  content: z.string(),
  renderType: z.enum(["text", "hybrid", "image"]).default("text"),
  imageUrl: z.string().optional(),
  imageAlt: z.string().optional(),
});

// Person in context section
export const PersonInContextSchema = z.object({
  title: z.string(),
  narrative: z.string(),
  imageUrl: z.string().optional(),
  imageAlt: z.string().optional(),
  caption: z.string().optional(),
});

// Patient baseline info
export const PatientBaselineSchema = z.object({
  name: z.string(),
  age: z.number(),
  diagnosis: z.string(),
  livingSituation: z.string(),
  ppsScore: z.number().min(0).max(100),
  additionalInfo: z.record(z.string()).optional(),
});

// Opening scene with optional media
export const OpeningSceneSchema = z.object({
  narrative: z.string(),
  mediaType: z.enum(["none", "image", "video"]).default("none"),
  mediaUrl: z.string().optional(),
  mediaAlt: z.string().optional(),
  mediaCaption: z.string().optional(),
});

// MCQ option with scoring
export const MCQOptionSchema = z.object({
  id: z.string(),
  label: z.string(), // A, B, C, D, E
  text: z.string(),
  score: z.number().min(0).max(5), // 0, 1, 2, or 5
  feedbackIfSelected: z.string().optional(),
});

// Cluster feedback sections
export const ClusterFeedbackSchema = z.object({
  rationale: z.string(),
  knownOutcomes: z.string(),
  thinkingPattern: z.string(),
  reasoningTrace: z.string(),
  evidenceAnchors: z.array(z.object({
    title: z.string(),
    url: z.string().optional(),
    citation: z.string().optional(),
  })),
});

// MCQ question with cluster mapping
export const MCQQuestionSchema = z.object({
  id: z.string(),
  questionNumber: z.number(),
  stem: z.string(),
  options: z.array(MCQOptionSchema).length(5),
  clusterFeedback: z.record(ClusterFeedbackSchema), // A, B, C cluster feedback
  correctCombination: z.array(z.string()).length(2), // IDs of correct options
});

// IP Insights perspective
export const IPPerspectiveSchema = z.object({
  id: z.string(),
  role: z.enum(["nurse", "care_aide", "wound_specialist", "mrp"]),
  title: z.string(),
  perspective: z.string(),
  videoNoteUrl: z.string().optional(),
  keyInsights: z.array(z.string()),
});

// Complete case schema
export const CaseSchema = z.object({
  schemaVersion: z.literal("1.1"),
  contentType: z.literal("case"),
  caseId: z.string(),
  level: z.number(),
  title: z.string(),
  patientBaseline: PatientBaselineSchema,
  personInContext: PersonInContextSchema,
  openingScene: OpeningSceneSchema,
  chartEntries: z.array(ChartEntrySchema),
  questions: z.array(MCQQuestionSchema),
  ipInsights: z.array(IPPerspectiveSchema).length(4),
  badgeThresholds: z.object({
    standard: z.number(),
    premium: z.number(),
  }),
});

// Simulacrum schema
export const SimulacrumOptionSchema = z.object({
  id: z.string(),
  title: z.string(),
  focus: z.string(),
  patientName: z.string(),
  duration: z.string(),
  questions: z.array(z.object({
    id: z.string(),
    stem: z.string(),
    options: z.array(z.object({
      id: z.string(),
      label: z.string(),
      text: z.string(),
      isCorrect: z.boolean(),
    })).length(4),
  })).length(4),
});

export const SimulacrumSchema = z.object({
  schemaVersion: z.literal("1.1"),
  contentType: z.literal("simulacrum"),
  levelId: z.string(),
  options: z.array(SimulacrumOptionSchema).length(3),
});

// Type exports
export type ChartEntry = z.infer<typeof ChartEntrySchema>;
export type PersonInContext = z.infer<typeof PersonInContextSchema>;
export type PatientBaseline = z.infer<typeof PatientBaselineSchema>;
export type OpeningScene = z.infer<typeof OpeningSceneSchema>;
export type MCQOption = z.infer<typeof MCQOptionSchema>;
export type ClusterFeedback = z.infer<typeof ClusterFeedbackSchema>;
export type MCQQuestion = z.infer<typeof MCQQuestionSchema>;
export type IPPerspective = z.infer<typeof IPPerspectiveSchema>;
export type Case = z.infer<typeof CaseSchema>;
export type SimulacrumOption = z.infer<typeof SimulacrumOptionSchema>;
export type Simulacrum = z.infer<typeof SimulacrumSchema>;
