import type { Case, Simulacrum } from "./content-schema";

// Stub data for Case 1 - renders UI without JSON files
export const stubCase: Case = {
  schemaVersion: "1.1",
  contentType: "case",
  caseId: "case-1",
  level: 1,
  title: "Adam's Journey: Managing Complex Symptoms",
  patientBaseline: {
    name: "Adam",
    age: 72,
    diagnosis: "Recurrent Colorectal Cancer with Liver Metastases",
    livingSituation: "Lives with spouse in suburban home",
    ppsScore: 50,
    additionalInfo: {
      "Primary Caregiver": "Spouse (Maria)",
      "Mobility": "Requires assistance",
      "Current Medications": "Morphine, Dexamethasone, Ondansetron",
    },
  },
  personInContext: {
    title: "About Adam",
    narrative: "Adam is a 72-year-old retired electrician who has been living with recurrent colorectal cancer for the past 18 months. He is known for his dry sense of humor and his love of gardening. Despite his illness, he has maintained a positive outlook and continues to find joy in small moments with his family. His wife Maria has been his primary caregiver and advocate throughout his journey.",
    imageUrl: "/placeholder.svg",
    imageAlt: "Portrait of Adam, a 72-year-old man with a warm smile",
    caption: "Adam in his garden, photographed last spring",
  },
  openingScene: {
    narrative: "It's a Tuesday morning when you arrive at Adam's home for a scheduled palliative care visit. Maria greets you at the door, looking more tired than usual. She mentions that Adam had a difficult night with increased pain and nausea. As you enter the living room, you find Adam resting in his recliner, appearing pale but alert. He manages a small smile as he sees you.",
    mediaType: "none",
  },
  chartEntries: [
    {
      id: "entry-1",
      timestamp: "2024-01-15 09:30",
      title: "Initial Assessment",
      content: "Patient reports increased abdominal pain (7/10) over past 48 hours. Current morphine regimen appears insufficient. Nausea present, limiting oral intake.",
      renderType: "text",
    },
    {
      id: "entry-2",
      timestamp: "2024-01-15 09:45",
      title: "Vital Signs",
      content: "BP: 118/72, HR: 88, RR: 18, Temp: 37.2°C, SpO2: 96% on room air. Weight: 68kg (down 2kg from last visit).",
      renderType: "text",
    },
    {
      id: "entry-3",
      timestamp: "2024-01-15 10:00",
      title: "Wound Assessment",
      content: "Abdominal surgical site healing well. No signs of infection. Mild skin irritation noted around ostomy site.",
      renderType: "hybrid",
    },
  ],
  questions: [
    {
      id: "q1",
      questionNumber: 1,
      stem: "Based on Adam's current presentation, which TWO clinical priorities should guide your immediate assessment?",
      options: [
        {
          id: "q1-a",
          label: "A",
          text: "Evaluate pain management effectiveness and consider dose adjustment",
          score: 5,
        },
        {
          id: "q1-b",
          label: "B",
          text: "Assess hydration status and nutritional intake",
          score: 5,
        },
        {
          id: "q1-c",
          label: "C",
          text: "Order immediate CT scan to rule out disease progression",
          score: 1,
        },
        {
          id: "q1-d",
          label: "D",
          text: "Recommend hospital admission for observation",
          score: 0,
        },
        {
          id: "q1-e",
          label: "E",
          text: "Focus primarily on caregiver support before patient assessment",
          score: 2,
        },
      ],
      clusterFeedback: {
        A: {
          rationale: "Excellent clinical reasoning. You correctly identified the two most pressing clinical priorities.",
          knownOutcomes: "Research shows that timely pain reassessment and nutritional support significantly improve quality of life in palliative care patients.",
          thinkingPattern: "Your approach demonstrates systematic prioritization of symptom management.",
          reasoningTrace: "Pain control (7/10) + Nausea limiting intake → Both require immediate attention in home palliative care context.",
          evidenceAnchors: [
            { title: "WHO Pain Management Guidelines", citation: "WHO, 2018" },
            { title: "Palliative Care Symptom Management", citation: "JPSM, 2022" },
          ],
        },
        B: {
          rationale: "Good thinking, though one priority may need reconsideration.",
          knownOutcomes: "Addressing symptom burden remains central to palliative care outcomes.",
          thinkingPattern: "Your reasoning shows awareness of multiple care dimensions.",
          reasoningTrace: "Consider which interventions can be effectively managed in the home setting.",
          evidenceAnchors: [
            { title: "Home-Based Palliative Care", citation: "Lancet, 2021" },
          ],
        },
        C: {
          rationale: "Some priorities selected may not align with palliative care goals in this context.",
          knownOutcomes: "Burdensome interventions should be carefully weighed against comfort-focused goals.",
          thinkingPattern: "Consider the patient's current care goals and setting.",
          reasoningTrace: "Reflect on what interventions provide the most benefit with least burden.",
          evidenceAnchors: [
            { title: "Goals of Care in Palliative Medicine", citation: "AAHPM, 2020" },
          ],
        },
      },
      correctCombination: ["q1-a", "q1-b"],
    },
  ],
  ipInsights: [
    {
      id: "ip-nurse",
      role: "nurse",
      title: "Nurse Perspective",
      perspective: "As the primary care coordinator, I've noticed that Adam's pain has been escalating over the past week. He's been reluctant to report it, often minimizing his symptoms to avoid 'being a burden.' Maria confided that he's been waking frequently at night, which is affecting both of their rest. I recommend a thorough pain reassessment using the Edmonton Symptom Assessment System.",
      keyInsights: [
        "Patient tends to underreport symptoms",
        "Night-time pain disrupting sleep for both patient and caregiver",
        "Consider ESAS for comprehensive symptom evaluation",
      ],
    },
    {
      id: "ip-aide",
      role: "care_aide",
      title: "Care Aide Perspective",
      perspective: "I visit Adam three times a week for personal care assistance. I've noticed he's eating much less than before and often pushes away his breakfast. He mentioned that food 'doesn't taste right anymore' and that he feels full after just a few bites. Maria seems stressed about meal preparation, trying different recipes to tempt his appetite.",
      keyInsights: [
        "Significant decrease in oral intake",
        "Taste changes affecting appetite",
        "Early satiety present",
        "Caregiver stress around nutrition",
      ],
    },
    {
      id: "ip-wound",
      role: "wound_specialist",
      title: "Wound Care Specialist Perspective",
      perspective: "The ostomy site is functioning well, but I'm concerned about the peristomal skin irritation. It's mild now but could worsen if not addressed. I've recommended a barrier cream and will reassess next week. The surgical incision has healed completely with no signs of complications.",
      keyInsights: [
        "Ostomy functioning normally",
        "Early peristomal skin changes need monitoring",
        "Barrier cream intervention initiated",
      ],
    },
    {
      id: "ip-mrp",
      role: "mrp",
      title: "Most Responsible Practitioner Perspective",
      perspective: "Adam's current symptom escalation is consistent with disease progression, though we should rule out reversible causes. I'm considering a morphine dose increase and the addition of an adjuvant analgesic. We should also discuss goals of care with Adam and Maria, as this may be an appropriate time to revisit his advance care plan.",
      keyInsights: [
        "Symptom escalation may indicate progression",
        "Medication adjustment under consideration",
        "Goals of care conversation appropriate",
        "Advance care planning review needed",
      ],
    },
  ],
  badgeThresholds: {
    standard: 35,
    premium: 50,
  },
};

// Stub Simulacrum data
export const stubSimulacrum: Simulacrum = {
  schemaVersion: "1.1",
  contentType: "simulacrum",
  levelId: "level-1",
  options: [
    {
      id: "sim-1",
      title: "Pain Management Principles",
      focus: "Opioid titration and breakthrough dosing",
      patientName: "Mrs. Chen",
      duration: "5 min",
      questions: [
        {
          id: "sim1-q1",
          stem: "When calculating breakthrough opioid doses, what percentage of the total daily dose is typically recommended?",
          options: [
            { id: "a", label: "A", text: "5-10%", isCorrect: false },
            { id: "b", label: "B", text: "10-15%", isCorrect: true },
            { id: "c", label: "C", text: "20-25%", isCorrect: false },
            { id: "d", label: "D", text: "30-40%", isCorrect: false },
          ],
        },
        {
          id: "sim1-q2",
          stem: "Which of the following is NOT a common side effect of opioid initiation?",
          options: [
            { id: "a", label: "A", text: "Constipation", isCorrect: false },
            { id: "b", label: "B", text: "Nausea", isCorrect: false },
            { id: "c", label: "C", text: "Diarrhea", isCorrect: true },
            { id: "d", label: "D", text: "Drowsiness", isCorrect: false },
          ],
        },
        {
          id: "sim1-q3",
          stem: "True tolerance to which opioid side effect does NOT typically develop?",
          options: [
            { id: "a", label: "A", text: "Nausea", isCorrect: false },
            { id: "b", label: "B", text: "Sedation", isCorrect: false },
            { id: "c", label: "C", text: "Constipation", isCorrect: true },
            { id: "d", label: "D", text: "Cognitive effects", isCorrect: false },
          ],
        },
        {
          id: "sim1-q4",
          stem: "What is the recommended first-line laxative regimen for opioid-induced constipation?",
          options: [
            { id: "a", label: "A", text: "Stimulant laxative alone", isCorrect: false },
            { id: "b", label: "B", text: "Osmotic laxative alone", isCorrect: false },
            { id: "c", label: "C", text: "Combination of stimulant and osmotic", isCorrect: true },
            { id: "d", label: "D", text: "Fiber supplements only", isCorrect: false },
          ],
        },
      ],
    },
    {
      id: "sim-2",
      title: "Nausea and Vomiting Management",
      focus: "Antiemetic selection and pathways",
      patientName: "Mr. Thompson",
      duration: "5 min",
      questions: [
        {
          id: "sim2-q1",
          stem: "Which receptor is primarily targeted by ondansetron for nausea management?",
          options: [
            { id: "a", label: "A", text: "Dopamine D2", isCorrect: false },
            { id: "b", label: "B", text: "Serotonin 5-HT3", isCorrect: true },
            { id: "c", label: "C", text: "Histamine H1", isCorrect: false },
            { id: "d", label: "D", text: "Muscarinic", isCorrect: false },
          ],
        },
        {
          id: "sim2-q2",
          stem: "For nausea caused by gastric stasis, which antiemetic class is most appropriate?",
          options: [
            { id: "a", label: "A", text: "5-HT3 antagonists", isCorrect: false },
            { id: "b", label: "B", text: "Prokinetic agents", isCorrect: true },
            { id: "c", label: "C", text: "Antihistamines", isCorrect: false },
            { id: "d", label: "D", text: "Benzodiazepines", isCorrect: false },
          ],
        },
        {
          id: "sim2-q3",
          stem: "Which antiemetic should be avoided in patients with Parkinson's disease?",
          options: [
            { id: "a", label: "A", text: "Ondansetron", isCorrect: false },
            { id: "b", label: "B", text: "Metoclopramide", isCorrect: true },
            { id: "c", label: "C", text: "Dexamethasone", isCorrect: false },
            { id: "d", label: "D", text: "Scopolamine", isCorrect: false },
          ],
        },
        {
          id: "sim2-q4",
          stem: "Anticipatory nausea is best managed with which medication class?",
          options: [
            { id: "a", label: "A", text: "Prokinetics", isCorrect: false },
            { id: "b", label: "B", text: "Antihistamines", isCorrect: false },
            { id: "c", label: "C", text: "Benzodiazepines", isCorrect: true },
            { id: "d", label: "D", text: "Corticosteroids", isCorrect: false },
          ],
        },
      ],
    },
    {
      id: "sim-3",
      title: "Goals of Care Conversations",
      focus: "Communication and shared decision-making",
      patientName: "Family Garcia",
      duration: "5 min",
      questions: [
        {
          id: "sim3-q1",
          stem: "Which communication technique involves reflecting back what the patient has said?",
          options: [
            { id: "a", label: "A", text: "Empathic responding", isCorrect: false },
            { id: "b", label: "B", text: "Active listening", isCorrect: true },
            { id: "c", label: "C", text: "Open-ended questioning", isCorrect: false },
            { id: "d", label: "D", text: "Prognostic disclosure", isCorrect: false },
          ],
        },
        {
          id: "sim3-q2",
          stem: "The SPIKES protocol is primarily used for which type of conversation?",
          options: [
            { id: "a", label: "A", text: "Medication reconciliation", isCorrect: false },
            { id: "b", label: "B", text: "Breaking bad news", isCorrect: true },
            { id: "c", label: "C", text: "Discharge planning", isCorrect: false },
            { id: "d", label: "D", text: "Family meetings", isCorrect: false },
          ],
        },
        {
          id: "sim3-q3",
          stem: "When a patient says 'I don't want to be a burden,' the best initial response is to:",
          options: [
            { id: "a", label: "A", text: "Reassure them they aren't a burden", isCorrect: false },
            { id: "b", label: "B", text: "Explore what 'burden' means to them", isCorrect: true },
            { id: "c", label: "C", text: "Discuss care facility options", isCorrect: false },
            { id: "d", label: "D", text: "Change the subject", isCorrect: false },
          ],
        },
        {
          id: "sim3-q4",
          stem: "Which element is NOT part of informed consent for treatment decisions?",
          options: [
            { id: "a", label: "A", text: "Nature of the intervention", isCorrect: false },
            { id: "b", label: "B", text: "Risks and benefits", isCorrect: false },
            { id: "c", label: "C", text: "Guarantee of outcomes", isCorrect: true },
            { id: "d", label: "D", text: "Alternative options", isCorrect: false },
          ],
        },
      ],
    },
  ],
};
