import { z } from "zod";

// Schema v1.2 - Palliative Care Case Content Schema with Phased MCQ Reveal

/**
 * Current schema version - used for validation
 * Update this when schema changes require content updates
 */
export const CURRENT_SCHEMA_VERSION = "1.2";

// Chart entry with metadata about source
export const ChartEntrySchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  source: z.string().optional(), // e.g., "Nurse (home care)", "Wound care specialist"
  timing: z.string().optional(), // e.g., "Documented prior to initial visit"
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

// Patient perspective (first-person voice-over)
export const PatientPerspectiveSchema = z.object({
  narrative: z.string(),
  imageUrl: z.string().optional(),
  imageAlt: z.string().optional(),
  caption: z.string().optional(),
});

// MCQ option with scoring
export const MCQOptionSchema = z.object({
  id: z.string(),
  label: z.string(), // A, B, C, D, E
  text: z.string(),
  score: z.number().min(0).max(5), // 1, 2, or 5
});

// Cluster A feedback (Correct Reasoning) - 4 sections
export const ClusterAFeedbackSchema = z.object({
  type: z.literal("A"),
  rationale: z.string(),
  knownOutcomes: z.string(),
  thinkingPatternInsight: z.string(),
  reasoningTrace: z.string(),
});

// Cluster B feedback (Partial-Credit Reasoning) - 4 sections
export const ClusterBFeedbackSchema = z.object({
  type: z.literal("B"),
  rationale: z.string(),
  likelyConsequences: z.string(),
  thinkingPatternInsight: z.string(),
  reasoningTrace: z.string(),
});

// Cluster C feedback (Misconception) - 5 sections
export const ClusterCFeedbackSchema = z.object({
  type: z.literal("C"),
  boundaryExplanation: z.string(),
  likelyDetrimentalOutcomes: z.string(),
  thinkingPatternInsight: z.string(),
  reasoningTrace: z.string(),
  safetyReframe: z.string(),
});

// Union of all cluster feedback types
export const ClusterFeedbackSchema = z.union([
  ClusterAFeedbackSchema,
  ClusterBFeedbackSchema,
  ClusterCFeedbackSchema,
]);

// MCQ question with phased reveal support
export const MCQQuestionSchema = z.object({
  id: z.string(),
  questionNumber: z.number(),
  stem: z.string(), // Decision stem shown first
  chartEntryIds: z.array(z.string()), // IDs of chart entries revealed for this question
  options: z.array(MCQOptionSchema).length(5),
  clusterFeedback: z.object({
    A: ClusterAFeedbackSchema,
    B: ClusterBFeedbackSchema,
    C: ClusterCFeedbackSchema,
  }),
  correctCombination: z.array(z.string()).length(2), // IDs of correct options
});

// IP Insights perspective
export const IPPerspectiveSchema = z.object({
  id: z.string(),
  role: z.enum(["nurse", "care_aide", "wound_specialist", "mrp"]),
  title: z.string(),
  perspective: z.string(),
  imageUrl: z.string().optional(),
  videoNoteUrl: z.string().optional(),
  keyInsights: z.array(z.string()).optional(),
});

// Just-in-Time Resource schema
export const JITResourceSchema = z.object({
  id: z.string(),
  title: z.string(),
  placement: z.enum(["intro", "mid-case", "post-feedback", "pre-lived-experience", "post-case"]),
  summary: z.string(),
  content: z.string().optional(),
  points: z.number().default(2),
});

// Podcast resource schema
export const PodcastSchema = z.object({
  id: z.string(),
  title: z.string(),
  provider: z.enum(["vimeo", "youtube"]).default("vimeo"),
  embedUrl: z.string(),
  duration: z.string(),
  transcriptUrl: z.string().optional(),
  points: z.number().default(1),
});

// Complete case schema
export const CaseSchema = z.object({
  schemaVersion: z.literal("1.2"),
  contentType: z.literal("case"),
  caseId: z.string(),
  level: z.number(),
  title: z.string(),
  patientBaseline: PatientBaselineSchema,
  personInContext: PersonInContextSchema,
  openingScene: OpeningSceneSchema,
  patientPerspective: PatientPerspectiveSchema.optional(),
  chartEntries: z.array(ChartEntrySchema),
  questions: z.array(MCQQuestionSchema),
  ipInsights: z.array(IPPerspectiveSchema).length(4),
  jitResources: z.array(JITResourceSchema).optional(),
  podcasts: z.array(PodcastSchema).optional(),
  badgeThresholds: z.object({
    standard: z.number(),
    premium: z.number(),
  }),
});

// Type exports
export type ChartEntry = z.infer<typeof ChartEntrySchema>;
export type PersonInContext = z.infer<typeof PersonInContextSchema>;
export type PatientBaseline = z.infer<typeof PatientBaselineSchema>;
export type OpeningScene = z.infer<typeof OpeningSceneSchema>;
export type PatientPerspective = z.infer<typeof PatientPerspectiveSchema>;
export type MCQOption = z.infer<typeof MCQOptionSchema>;
export type ClusterAFeedback = z.infer<typeof ClusterAFeedbackSchema>;
export type ClusterBFeedback = z.infer<typeof ClusterBFeedbackSchema>;
export type ClusterCFeedback = z.infer<typeof ClusterCFeedbackSchema>;
export type ClusterFeedback = z.infer<typeof ClusterFeedbackSchema>;
export type MCQQuestion = z.infer<typeof MCQQuestionSchema>;
export type IPPerspective = z.infer<typeof IPPerspectiveSchema>;
export type JITResource = z.infer<typeof JITResourceSchema>;
export type Podcast = z.infer<typeof PodcastSchema>;
export type Case = z.infer<typeof CaseSchema>;
