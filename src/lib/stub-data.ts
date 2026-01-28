import type { Case, Simulacrum } from "./content-schema";

// Real content for Case 01 - Adam's Case (Wound Assessment & Hemorrhage Risk)
// Based on Case_01_6C_MCQs_v1-2.docx
export const stubCase: Case = {
  schemaVersion: "1.2",
  contentType: "case",
  caseId: "case-1",
  level: 1,
  title: "Adam's Journey: Wound Assessment & Hemorrhage Risk",
  patientBaseline: {
    name: "Adam",
    age: 68,
    diagnosis: "Recurrent squamous cell carcinoma of jaw",
    livingSituation: "Living at home with family",
    ppsScore: 40,
    additionalInfo: {
      "Care Context": "Ongoing disease-focused care through oncology service",
      "Current Concern": "Chronic wound under jaw with intermittent bleeding",
    },
  },
  personInContext: {
    title: "About Adam",
    narrative: "Adam lives at home with his family. He's a quiet man who doesn't take up much space. When things feel tense, he goes still and looks away, as if waiting for the moment to pass. His son stays close, watching carefully. His daughter-in-law fills silences with quick apologies, trying to keep the room steady.\n\nHome is both familiar and crowded, with attention always pulled toward small changes and what they might mean. The family wants to do the right thing, but they don't always agree on what \"right\" looks like.\n\nThis is where your involvement in his care begins.",
    imageUrl: "/placeholder.svg",
    imageAlt: "Portrait of Adam, a 68-year-old man",
    caption: "Adam at home with his family",
  },
  openingScene: {
    narrative: "You're on call when the nurse phones mid-afternoon. Her voice is tight. \"They're worried again.\" You drive over and let yourself in, hearing movement before you reach the room.\n\nAdam is upright in his chair, a towel tucked under his jaw. His son stands close, eyes fixed on the fabric. His daughter-in-law keeps apologizing, as if she's taking up too much space. Adam is quiet. He meets your eyes briefly, then looks away.\n\nThe family shifts as you come closer. The towel darkens in one area, then again. No one says much. Their attention stays on the same spot, watching for any change.\n\nYou take a breath, wash your hands, and step in beside the chair.",
    mediaType: "none",
  },
  patientPerspective: {
    narrative: "I've always been a watcher. I notice small changes, the way people move around me, the looks they exchange when they think I'm not paying attention. I spend a lot of my day sitting quietly, listening to the house, watching my son and daughter-in-law go about their routines. It matters to me that we stay here together, in our own space, where things still feel familiar.\n\nWhat's hard is seeing how tense they get. I can feel it when they hover a little closer or keep checking the same thing over and over. They try not to show it, but I know they're scared. I don't always know what to say to make that easier, and sometimes I worry that speaking up will make it worse instead of better.\n\nThere are moments when I'm not sure what's coming next or how quickly things might change. I don't need everything explained or settled all at once. I just want to know that we're paying attention together, and that we're not letting fear take over the room.\n\nI want us to keep facing things as they are, one moment at a time.",
    imageUrl: "/placeholder.svg",
    imageAlt: "Adam reflecting quietly",
    caption: "In Adam's words",
  },
  chartEntries: [
    // MCQ 1 Chart Entries (3 entries)
    {
      id: "chart-1-1",
      title: "Chart Summary",
      content: "Diagnosis: recurrent squamous cell carcinoma of jaw; living at home; receiving disease-focused oncology care.",
      source: "Chart summary",
      timing: "Documented prior to initial visit",
    },
    {
      id: "chart-1-2",
      title: "Functional Status",
      content: "PPS documented as 40%; requires significant assistance with self-care.",
      source: "Nurse (home care)",
      timing: "Recorded during prior home visit",
    },
    {
      id: "chart-1-3",
      title: "Symptom History",
      content: "Chronic wound with intermittent low-volume bleeding; no prior emergency transfers.",
      source: "Wound care specialist",
      timing: "Entered following prior wound assessment",
    },
    // MCQ 2 Chart Entries (2 entries)
    {
      id: "chart-2-1",
      title: "Family Observation",
      content: "Family repeatedly checking wound dressing saturation; visible anxiety when dressing darkens.",
      source: "Nurse (home care)",
      timing: "Observed during current visit",
    },
    {
      id: "chart-2-2",
      title: "Patient Statement",
      content: "Adam mentioned wanting to 'stay home no matter what' and avoid hospital if possible.",
      source: "Personal Support Worker",
      timing: "Reported from recent care visit",
    },
    // MCQ 3 Chart Entries (2 entries)
    {
      id: "chart-3-1",
      title: "Care Gap Identified",
      content: "No palliative care consultation documented despite advanced disease and complex symptoms.",
      source: "Chart review",
      timing: "Identified during current assessment",
    },
    {
      id: "chart-3-2",
      title: "Wound Assessment Update",
      content: "Visible vascularity in wound bed; tumor erosion noted; carotid artery proximity flagged.",
      source: "Wound care specialist",
      timing: "Updated following current examination",
    },
    // MCQ 4 Chart Entries (2 entries)
    {
      id: "chart-4-1",
      title: "Hemorrhage Kit Status",
      content: "Hemorrhage kit prepared: dark towels, sedative medications (midazolam), written instructions for family.",
      source: "Home care team",
      timing: "Prepared following goals of care discussion",
    },
    {
      id: "chart-4-2",
      title: "Goals of Care Documentation",
      content: "Patient wishes comfort-focused care at home; no CPR; no hospital transfer for hemorrhage event.",
      source: "MRP",
      timing: "Documented after family meeting",
    },
  ],
  questions: [
    // MCQ 1
    {
      id: "q1",
      questionNumber: 1,
      stem: "After examining the wound, you notice the family watching closely as the dressing darkens with slow oozing. Adam sits quietly, eyes down, while his son and daughter-in-law hover nearby. The tension in the room is palpable. What do you focus on now?",
      chartEntryIds: ["chart-1-1", "chart-1-2", "chart-1-3"],
      options: [
        {
          id: "q1-a",
          label: "A",
          text: "Frame the current bleeding as a manageable symptom while opening space to introduce broader palliative support alongside ongoing care.",
          score: 5,
        },
        {
          id: "q1-b",
          label: "B",
          text: "Maintain focus on wound management today and defer any broader care discussion until bleeding fully settles.",
          score: 2,
        },
        {
          id: "q1-c",
          label: "C",
          text: "Emphasize the seriousness of recurrent bleeding to prepare the family for likely hospital transfer.",
          score: 1,
        },
        {
          id: "q1-d",
          label: "D",
          text: "Acknowledge the bleeding concern while naming that additional supportive care could be added without changing current treatment.",
          score: 5,
        },
        {
          id: "q1-e",
          label: "E",
          text: "Reassure the family that no further planning is needed since bleeding has not required emergency care before.",
          score: 2,
        },
      ],
      clusterFeedback: {
        A: {
          type: "A",
          rationale: "This reasoning fits the chart reality. Bleeding is present but not catastrophic, function is limited, and care intent is undefined. The moment supports introducing supportive care without forcing a transition.",
          knownOutcomes: "Families often feel less panicked when symptoms are named as manageable and planning starts early. Care remains aligned with home-based goals.",
          thinkingPatternInsight: "This reflects anticipatory framing. Clinicians use it when uncertainty is present but signals are accumulating. It keeps options open rather than waiting for crisis.",
          reasoningTrace: "You notice ongoing oozing, family vigilance, and limited function. With no emergency history, you widen the frame to include added support now.",
        },
        B: {
          type: "B",
          rationale: "This approach recognizes bleeding as concerning but keeps attention on immediate control rather than broader readiness. It pauses integration rather than actively excluding it.",
          likelyConsequences: "Planning may be delayed until fear escalates again. Families may remain uncertain about next steps.",
          thinkingPatternInsight: "This reflects containment-first reasoning. It often shows up when clinicians want stability before opening bigger conversations.",
          reasoningTrace: "You attend to the wound and visible calm but leave wider care framing for later.",
        },
        C: {
          type: "C",
          boundaryExplanation: "This line of reasoning treats visible bleeding as proof that escalation is required, narrowing options too early in a situation where stability still exists.",
          likelyDetrimentalOutcomes: "Family fear may intensify, increasing likelihood of unnecessary hospital transfer.",
          thinkingPatternInsight: "This reflects catastrophe anchoring. Salient visual cues can override broader context under pressure.",
          reasoningTrace: "You focus on blood as danger and assume hospital care is the safest response.",
          safetyReframe: "Pause and reassess how much uncertainty is actually resolved versus how much remains open.",
        },
      },
      correctCombination: ["q1-a", "q1-d"],
    },
    // MCQ 2
    {
      id: "q2",
      questionNumber: 2,
      stem: "Adam's daughter-in-law asks you directly: 'Is this going to get worse? Should we be doing something different?' Adam remains silent but shifts in his chair. His son looks away. How do you respond?",
      chartEntryIds: ["chart-2-1", "chart-2-2"],
      options: [
        {
          id: "q2-a",
          label: "A",
          text: "Acknowledge her concern and invite the family into a broader conversation about what may lie ahead, including Adam if he wishes to participate.",
          score: 5,
        },
        {
          id: "q2-b",
          label: "B",
          text: "Reassure her that the current care plan is adequate and that changes are not needed at this time.",
          score: 2,
        },
        {
          id: "q2-c",
          label: "C",
          text: "Redirect the conversation to Adam and ask him directly whether he wants to discuss his prognosis now.",
          score: 1,
        },
        {
          id: "q2-d",
          label: "D",
          text: "Validate the daughter-in-law's anxiety while gently naming that planning ahead could reduce uncertainty for everyone.",
          score: 5,
        },
        {
          id: "q2-e",
          label: "E",
          text: "Defer the question until the wound care visit is complete, then schedule a follow-up specifically for care planning.",
          score: 2,
        },
      ],
      clusterFeedback: {
        A: {
          type: "A",
          rationale: "This reasoning matches the family dynamics on display. The daughter-in-law is seeking clarity, Adam is present but withdrawn, and the son is avoidant. Opening a shared conversation respects all perspectives.",
          knownOutcomes: "Inclusive conversations reduce family conflict and ensure care preferences reflect the patient's voice. Planning early prevents crisis-driven decisions.",
          thinkingPatternInsight: "This reflects relational awareness. Clinicians tune into non-verbal cues and group dynamics to calibrate how to proceed.",
          reasoningTrace: "You recognize family readiness signals, Adam's silence as possible consent, and the opportunity to start planning without forcing disclosure.",
        },
        B: {
          type: "B",
          rationale: "This approach offers reassurance but may close the door on a conversation the family is trying to open. It stabilizes the moment without expanding the care frame.",
          likelyConsequences: "The family may feel unheard. Anxiety may persist or resurface at a less opportune time.",
          thinkingPatternInsight: "This reflects reassurance seeking. It can soothe in the short term but may delay needed conversations.",
          reasoningTrace: "You prioritize calm over opening, which may not match the family's actual readiness.",
        },
        C: {
          type: "C",
          boundaryExplanation: "This approach puts Adam on the spot in a way that may feel confrontational or shaming, especially given his withdrawn posture and silence.",
          likelyDetrimentalOutcomes: "Adam may shut down further. Family dynamics may become strained. Trust in the care team could erode.",
          thinkingPatternInsight: "This reflects directness without attunement. It prioritizes agenda over relational safety.",
          reasoningTrace: "You focus on Adam as the decision-maker without reading his current cues.",
          safetyReframe: "Consider whether Adam's silence is consent, resistance, or simply uncertainty—and how to honor all three.",
        },
      },
      correctCombination: ["q2-a", "q2-d"],
    },
    // MCQ 3
    {
      id: "q3",
      questionNumber: 3,
      stem: "During the visit, you learn that no palliative care consultation has been documented despite Adam's declining function and complex symptoms. The family seems unaware of what additional support might be available. What is your next step?",
      chartEntryIds: ["chart-3-1", "chart-3-2"],
      options: [
        {
          id: "q3-a",
          label: "A",
          text: "Explain what palliative care offers and suggest initiating a referral to provide added support alongside current oncology care.",
          score: 5,
        },
        {
          id: "q3-b",
          label: "B",
          text: "Document the gap but wait for the oncology team to initiate palliative involvement when they feel it is appropriate.",
          score: 2,
        },
        {
          id: "q3-c",
          label: "C",
          text: "Inform the family that palliative care is typically introduced when active treatment ends, so it may not be needed yet.",
          score: 1,
        },
        {
          id: "q3-d",
          label: "D",
          text: "Explore the family's understanding of Adam's trajectory and gently introduce palliative care as a way to enhance comfort and planning.",
          score: 5,
        },
        {
          id: "q3-e",
          label: "E",
          text: "Suggest that the family request a palliative care referral from the oncologist at their next scheduled appointment.",
          score: 2,
        },
      ],
      clusterFeedback: {
        A: {
          type: "A",
          rationale: "This reasoning addresses the documented care gap directly. Palliative care can be integrated alongside disease-focused treatment and does not require stopping oncology care.",
          knownOutcomes: "Early palliative care integration improves symptom management, family support, and alignment with patient values. It reduces crisis-driven interventions.",
          thinkingPatternInsight: "This reflects proactive integration. Clinicians recognize that waiting for 'the right time' often means missing the window entirely.",
          reasoningTrace: "You identify the gap, understand palliative care's role, and move toward action while keeping the family informed.",
        },
        B: {
          type: "B",
          rationale: "This approach acknowledges the gap but defers action to another team. It may delay needed support and leave the family without resources.",
          likelyConsequences: "Palliative involvement may come too late. The family may face crises without adequate preparation.",
          thinkingPatternInsight: "This reflects system deference. It assumes another team will take responsibility without checking.",
          reasoningTrace: "You note the gap but wait for someone else to act, which may not happen.",
        },
        C: {
          type: "C",
          boundaryExplanation: "This perpetuates the myth that palliative care is only for end-of-life. It misinforms the family and delays beneficial support.",
          likelyDetrimentalOutcomes: "The family may refuse palliative care when it is eventually offered, believing it signals 'giving up.'",
          thinkingPatternInsight: "This reflects outdated framing. Palliative care has evolved to support patients at any stage of serious illness.",
          reasoningTrace: "You apply a dated definition that no longer reflects best practice.",
          safetyReframe: "Consider what palliative care actually offers and how it might help Adam and his family right now.",
        },
      },
      correctCombination: ["q3-a", "q3-d"],
    },
    // MCQ 4
    {
      id: "q4",
      questionNumber: 4,
      stem: "After completing your assessment, you recognize that Adam is at risk for a significant hemorrhage event given the tumor's proximity to major vessels. The family has expressed a wish for Adam to remain at home. What do you prioritize now?",
      chartEntryIds: ["chart-4-1", "chart-4-2"],
      options: [
        {
          id: "q4-a",
          label: "A",
          text: "Initiate a discussion about preparing for potential hemorrhage, including what comfort measures would be available at home.",
          score: 5,
        },
        {
          id: "q4-b",
          label: "B",
          text: "Arrange for hospital transfer to ensure Adam has access to emergency surgical intervention if needed.",
          score: 1,
        },
        {
          id: "q4-c",
          label: "C",
          text: "Focus on optimizing wound care and reassess hemorrhage risk at the next scheduled visit.",
          score: 2,
        },
        {
          id: "q4-d",
          label: "D",
          text: "Work with the team to prepare a hemorrhage kit and ensure the family understands what to expect and how to respond.",
          score: 5,
        },
        {
          id: "q4-e",
          label: "E",
          text: "Recommend that the family keep emergency contact numbers handy and call 911 if significant bleeding occurs.",
          score: 2,
        },
      ],
      clusterFeedback: {
        A: {
          type: "A",
          rationale: "This reasoning aligns care with Adam's expressed wish to remain at home. Preparing for hemorrhage honors that preference while ensuring comfort measures are in place.",
          knownOutcomes: "Families with hemorrhage preparation report less trauma during acute events. Patients are more likely to achieve their goal of dying at home.",
          thinkingPatternInsight: "This reflects anticipatory planning. Clinicians prepare for foreseeable crises rather than reacting when they occur.",
          reasoningTrace: "You recognize the hemorrhage risk, honor the home preference, and move toward preparation rather than avoidance.",
        },
        B: {
          type: "B",
          rationale: "This approach prioritizes wound management but delays the critical conversation about hemorrhage preparedness. It may leave the family unprepared.",
          likelyConsequences: "If hemorrhage occurs before the next visit, the family will face it without support or guidance.",
          thinkingPatternInsight: "This reflects deferral under uncertainty. It avoids the difficult conversation in favor of routine care.",
          reasoningTrace: "You stay within the wound care frame and postpone risk planning.",
        },
        C: {
          type: "C",
          boundaryExplanation: "This approach prioritizes hospital access over the patient's clearly stated home preference. It may conflict with Adam's values and goals.",
          likelyDetrimentalOutcomes: "Adam may die during transport or in an unfamiliar hospital setting, contrary to his wishes. Family distress may increase.",
          thinkingPatternInsight: "This reflects risk aversion that overrides patient preference. It assumes hospital care is always safer.",
          reasoningTrace: "You focus on medical intervention availability rather than alignment with goals.",
          safetyReframe: "Consider what 'safe' means to Adam—is it emergency surgery or dying peacefully at home?",
        },
      },
      correctCombination: ["q4-a", "q4-d"],
    },
  ],
  ipInsights: [
    {
      id: "ip-nurse",
      role: "nurse",
      title: "Nurse",
      perspective: "The nurse has noticed the family returning to the same questions when worry rises, often re-checking the dressing in short intervals. Brief, concrete explanations can settle the room for a time. The tension often builds again, and the family starts scanning faces for reassurance they can hold onto.",
      imageUrl: "/ip-insights/nurse.png",
    },
    {
      id: "ip-aide",
      role: "care_aide",
      title: "Care Aide / Assistant / Support Worker",
      perspective: "The support worker has noticed how tired the household feels in the small hours and in the in-between moments. The family keeps normal routines going, but they hover close and listen for any change. When the wound comes up, conversation narrows. The home feels less like a refuge and more like a watch post.",
      imageUrl: "/ip-insights/care-aide.png",
    },
    {
      id: "ip-wound",
      role: "wound_specialist",
      title: "Wound Care Specialist",
      perspective: "The wound care specialist has noticed how quickly the family's focus tightens when details are shared about dressings and supplies. They ask for steps to be repeated and watch hands closely. When technical terms pile up, the room gets quieter. The family starts looking at one another instead of the speaker, then asks for certainty.",
      imageUrl: "/ip-insights/wound-specialist.png",
    },
    {
      id: "ip-mrp",
      role: "mrp",
      title: "Most Responsible Practitioner (MRP)",
      perspective: "The MRP has noticed how easily the family's questions land on a single point, \"How do we know it's really an emergency?\" They return to it after each explanation. When language stays plain and steady, the family can take in what is said. When language drifts into medical framing, they stiffen and push for a hospital plan.",
      imageUrl: "/ip-insights/mrp.png",
    },
  ],
  jitResources: [
    {
      id: "jit-hemorrhage-risk",
      title: "Understanding Wound Hemorrhage Risk",
      placement: "mid-case" as const,
      summary: "Learn about the key indicators of hemorrhage risk in patients with tumor involvement near major vessels. This resource covers assessment techniques and early warning signs that clinicians should monitor during wound care.",
      content: "Hemorrhage risk assessment involves evaluating several key factors: tumor proximity to major vessels (especially carotid artery in head/neck cancers), visible vascularity in the wound bed, history of bleeding episodes, and changes in wound characteristics. Early warning signs include increased oozing, changes in wound color, or pulsatile bleeding. Preparation includes having dark towels, sedative medications (midazolam), and clear family instructions ready before a crisis occurs.",
      points: 2,
    },
    {
      id: "jit-family-communication",
      title: "Family-Centered Communication in Palliative Care",
      placement: "post-feedback" as const,
      summary: "Explore strategies for navigating difficult conversations when family members have different levels of readiness for prognostic discussions.",
      content: "Effective family communication requires reading non-verbal cues, creating space for multiple perspectives, and avoiding putting patients on the spot. Key strategies include: acknowledging anxiety without dismissing it, inviting conversation rather than forcing disclosure, and naming that planning ahead can reduce uncertainty for everyone. Remember that silence may indicate consent, resistance, or uncertainty—and each deserves respect.",
      points: 2,
    },
  ],
  podcasts: [
    {
      id: "podcast-ep1",
      title: "Episode 1: From Caregiver to Change-Maker",
      provider: "vimeo" as const,
      embedUrl: "https://player.vimeo.com/video/1159004283?h=f63ff145ce&badge=0&autopause=0&player_id=0&app_id=58479",
      duration: "~15 min",
      transcriptUrl: "/transcripts/episode-1.pdf",
      points: 1,
    },
    {
      id: "podcast-ep2",
      title: "Episode 2: Everyday Resilience in Palliative Care",
      provider: "vimeo" as const,
      embedUrl: "https://player.vimeo.com/video/1159004255?h=b0e5e80f4d&badge=0&autopause=0&player_id=0&app_id=58479",
      duration: "~12 min",
      transcriptUrl: "/transcripts/episode-2.pdf",
      points: 1,
    },
  ],
  badgeThresholds: {
    standard: 28, // 4 questions × 7 points minimum to pass
    premium: 40,  // 4 questions × 10 points for perfect score
  },
};

// Stub Simulacrum data
export const stubSimulacrum: Simulacrum = {
  schemaVersion: "1.2",
  contentType: "simulacrum",
  levelId: "level-1",
  options: [
    {
      id: "sim-1",
      title: "Hemorrhage Management Principles",
      focus: "Anticipatory planning and crisis response",
      patientName: "Mr. Williams",
      duration: "5 min",
      questions: [
        {
          id: "sim1-q1",
          stem: "What is the primary goal of a hemorrhage kit in home palliative care?",
          options: [
            { id: "a", label: "A", text: "To stop the bleeding completely", isCorrect: false },
            { id: "b", label: "B", text: "To provide comfort and reduce distress during a bleed", isCorrect: true },
            { id: "c", label: "C", text: "To prepare for emergency transport to hospital", isCorrect: false },
            { id: "d", label: "D", text: "To document the bleeding event for legal purposes", isCorrect: false },
          ],
        },
        {
          id: "sim1-q2",
          stem: "Which medication is typically included in a hemorrhage kit for sedation?",
          options: [
            { id: "a", label: "A", text: "Haloperidol", isCorrect: false },
            { id: "b", label: "B", text: "Midazolam", isCorrect: true },
            { id: "c", label: "C", text: "Ondansetron", isCorrect: false },
            { id: "d", label: "D", text: "Dexamethasone", isCorrect: false },
          ],
        },
        {
          id: "sim1-q3",
          stem: "Why are dark-colored towels recommended in a hemorrhage kit?",
          options: [
            { id: "a", label: "A", text: "They are more absorbent than white towels", isCorrect: false },
            { id: "b", label: "B", text: "They reduce the visual impact of blood for patient and family", isCorrect: true },
            { id: "c", label: "C", text: "They are easier to clean after the event", isCorrect: false },
            { id: "d", label: "D", text: "They are required by home care regulations", isCorrect: false },
          ],
        },
        {
          id: "sim1-q4",
          stem: "When should goals of care regarding hemorrhage be discussed?",
          options: [
            { id: "a", label: "A", text: "Only after the first bleeding episode", isCorrect: false },
            { id: "b", label: "B", text: "When hemorrhage is imminent", isCorrect: false },
            { id: "c", label: "C", text: "Proactively, before a crisis occurs", isCorrect: true },
            { id: "d", label: "D", text: "After the patient is no longer able to participate", isCorrect: false },
          ],
        },
      ],
    },
    {
      id: "sim-2",
      title: "Goals of Care Conversations",
      focus: "Communication and shared decision-making",
      patientName: "Mrs. Chen",
      duration: "5 min",
      questions: [
        {
          id: "sim2-q1",
          stem: "What is the most important first step in a goals of care conversation?",
          options: [
            { id: "a", label: "A", text: "Explaining all treatment options available", isCorrect: false },
            { id: "b", label: "B", text: "Understanding the patient's values and priorities", isCorrect: true },
            { id: "c", label: "C", text: "Discussing prognosis in detail", isCorrect: false },
            { id: "d", label: "D", text: "Reviewing the medical chart thoroughly", isCorrect: false },
          ],
        },
        {
          id: "sim2-q2",
          stem: "How should a clinician respond when a patient says they want 'everything done'?",
          options: [
            { id: "a", label: "A", text: "Immediately arrange for aggressive interventions", isCorrect: false },
            { id: "b", label: "B", text: "Explore what 'everything' means to the patient", isCorrect: true },
            { id: "c", label: "C", text: "Explain why aggressive treatment isn't recommended", isCorrect: false },
            { id: "d", label: "D", text: "Document the request and move on", isCorrect: false },
          ],
        },
        {
          id: "sim2-q3",
          stem: "Which statement best reflects a patient-centered approach to care planning?",
          options: [
            { id: "a", label: "A", text: "'Based on your condition, I recommend hospice care.'", isCorrect: false },
            { id: "b", label: "B", text: "'What matters most to you as we plan your care?'", isCorrect: true },
            { id: "c", label: "C", text: "'Your family thinks you should focus on comfort.'", isCorrect: false },
            { id: "d", label: "D", text: "'Most patients in your situation choose palliative care.'", isCorrect: false },
          ],
        },
        {
          id: "sim2-q4",
          stem: "When is it appropriate to revisit goals of care?",
          options: [
            { id: "a", label: "A", text: "Only when the patient requests it", isCorrect: false },
            { id: "b", label: "B", text: "When there is a significant change in clinical status", isCorrect: true },
            { id: "c", label: "C", text: "At each scheduled appointment", isCorrect: false },
            { id: "d", label: "D", text: "Only at the time of initial diagnosis", isCorrect: false },
          ],
        },
      ],
    },
    {
      id: "sim-3",
      title: "Family Caregiver Support",
      focus: "Assessing and supporting family caregivers",
      patientName: "The Thompson Family",
      duration: "5 min",
      questions: [
        {
          id: "sim3-q1",
          stem: "What is the most common unmet need among family caregivers in palliative care?",
          options: [
            { id: "a", label: "A", text: "Financial assistance", isCorrect: false },
            { id: "b", label: "B", text: "Information and communication", isCorrect: true },
            { id: "c", label: "C", text: "Transportation support", isCorrect: false },
            { id: "d", label: "D", text: "Meal preparation help", isCorrect: false },
          ],
        },
        {
          id: "sim3-q2",
          stem: "Which sign might indicate caregiver burnout?",
          options: [
            { id: "a", label: "A", text: "Asking detailed questions about medications", isCorrect: false },
            { id: "b", label: "B", text: "Expressing frustration or withdrawal from care activities", isCorrect: true },
            { id: "c", label: "C", text: "Requesting additional home care visits", isCorrect: false },
            { id: "d", label: "D", text: "Taking notes during clinical discussions", isCorrect: false },
          ],
        },
        {
          id: "sim3-q3",
          stem: "How can healthcare providers best support anticipatory grief in caregivers?",
          options: [
            { id: "a", label: "A", text: "Avoid discussing death to prevent distress", isCorrect: false },
            { id: "b", label: "B", text: "Normalize grief reactions and provide space for expression", isCorrect: true },
            { id: "c", label: "C", text: "Focus only on practical care tasks", isCorrect: false },
            { id: "d", label: "D", text: "Refer immediately to bereavement services", isCorrect: false },
          ],
        },
        {
          id: "sim3-q4",
          stem: "What should be included in preparing a family for a potential home death?",
          options: [
            { id: "a", label: "A", text: "Instructions to call 911 immediately", isCorrect: false },
            { id: "b", label: "B", text: "Information about what to expect and who to call", isCorrect: true },
            { id: "c", label: "C", text: "Recommendation to transfer to hospital in final days", isCorrect: false },
            { id: "d", label: "D", text: "Assurance that death will not occur at home", isCorrect: false },
          ],
        },
      ],
    },
  ],
};
