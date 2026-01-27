import type { Case, Simulacrum } from "./content-schema";

// Real content for Case 01 - Adam's Case (Wound Assessment & Hemorrhage Risk)
export const stubCase: Case = {
  schemaVersion: "1.1",
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
    narrative: "Adam is a 68-year-old man living at home with his family. He has been diagnosed with recurrent squamous cell carcinoma of the jaw and is receiving ongoing disease-focused care through the oncology service. His Palliative Performance Scale (PPS) is 40%, indicating significant functional decline. He has expressed a preference to remain at home and avoid hospital admission if possible.",
    imageUrl: "/placeholder.svg",
    imageAlt: "Portrait of Adam, a 68-year-old man",
    caption: "Adam at home with his family",
  },
  openingScene: {
    narrative: "You are called to assess Adam at home. The family has been noting a chronic wound under his jaw with intermittent low-volume bleeding over the past few weeks. They have been repeatedly checking the wound dressing saturation during visits. Despite ongoing dressing changes, there continues to be oozing, though no acute hemorrhage has been recorded. There is no palliative care consultation documented to date.",
    mediaType: "none",
  },
  chartEntries: [
    {
      id: "entry-1",
      timestamp: "Day 1 - 09:00",
      title: "Chart Summary",
      content: "Diagnosis: recurrent squamous cell carcinoma of jaw. Living at home with family.",
      renderType: "text",
    },
    {
      id: "entry-2",
      timestamp: "Day 1 - 09:15",
      title: "Care Context",
      content: "Ongoing disease-focused care through oncology service.",
      renderType: "text",
    },
    {
      id: "entry-3",
      timestamp: "Day 1 - 09:30",
      title: "Functional Status",
      content: "PPS 40%.",
      renderType: "text",
    },
    {
      id: "entry-4",
      timestamp: "Day 1 - 10:00",
      title: "Symptom History",
      content: "Chronic wound under jaw with intermittent low-volume bleeding noted over weeks.",
      renderType: "text",
    },
    {
      id: "entry-5",
      timestamp: "Day 1 - 10:30",
      title: "Family Observation",
      content: "Family repeatedly checking wound dressing saturation during visits.",
      renderType: "text",
    },
    {
      id: "entry-6",
      timestamp: "Day 1 - 11:00",
      title: "Patient Statement",
      content: "Patient stated preference to remain at home and avoid hospital admission if possible.",
      renderType: "text",
    },
    {
      id: "entry-7",
      timestamp: "Day 1 - 11:30",
      title: "Symptom Update",
      content: "Ongoing oozing despite dressing changes; no acute hemorrhage recorded.",
      renderType: "text",
    },
    {
      id: "entry-8",
      timestamp: "Day 1 - 12:00",
      title: "Interprofessional Note",
      content: "No palliative care consultation documented to date.",
      renderType: "text",
    },
  ],
  questions: [
    {
      id: "q1",
      questionNumber: 1,
      stem: "What two chart entries would best support clinical decision-making at this point?",
      options: [
        {
          id: "q1-a",
          label: "A",
          text: "Documentation of tumor involvement with major blood vessels (e.g., carotid artery)",
          score: 5,
          feedbackIfSelected: "Critical information for hemorrhage risk assessment.",
        },
        {
          id: "q1-b",
          label: "B",
          text: "Results of a recent complete blood count (CBC)",
          score: 2,
          feedbackIfSelected: "Helpful but not the most critical for immediate risk stratification.",
        },
        {
          id: "q1-c",
          label: "C",
          text: "Record of recent oral intake and hydration status",
          score: 1,
          feedbackIfSelected: "Relevant to general care but not specific to hemorrhage risk.",
        },
        {
          id: "q1-d",
          label: "D",
          text: "Documented discussion about goals of care and emergency planning",
          score: 5,
          feedbackIfSelected: "Essential for guiding response to potential catastrophic bleeding.",
        },
        {
          id: "q1-e",
          label: "E",
          text: "Notes on medication adherence over the past month",
          score: 1,
          feedbackIfSelected: "General information not directly relevant to current clinical situation.",
        },
      ],
      clusterFeedback: {
        A: {
          rationale: "Excellent clinical reasoning. You correctly identified the two most critical chart entries for assessing hemorrhage risk and planning appropriate care. Documentation of vascular involvement is essential for risk stratification, and goals of care discussions are fundamental to determining the appropriate response to potential catastrophic bleeding in a patient who wishes to remain at home.",
          knownOutcomes: "Research demonstrates that early identification of major vessel involvement combined with proactive goals of care discussions leads to better-prepared families and more aligned care during crisis situations. Patients with documented care preferences experience less unwanted aggressive intervention at end of life.",
          thinkingPattern: "Your selections reflect sophisticated clinical judgment that balances technical risk assessment with person-centered care planning. You recognize that hemorrhage risk cannot be managed solely through medical interventions—it requires understanding patient values and preferences.",
          reasoningTrace: "Head/neck tumor + chronic bleeding + PPS 40% → Need to assess vessel proximity for risk stratification. Patient preference to stay home + no palliative consultation → Goals of care discussion is urgent and foundational for any emergency planning.",
          evidenceAnchors: [
            { title: "Management of Hemorrhage in Palliative Care", citation: "Journal of Palliative Medicine, 2021", url: "https://pubmed.ncbi.nlm.nih.gov/" },
            { title: "Carotid Blowout Syndrome: Recognition and Management", citation: "Head & Neck Oncology, 2020" },
            { title: "Goals of Care in Advanced Cancer", citation: "ASCO Guidelines, 2022" },
          ],
        },
        B: {
          rationale: "Your selections show awareness of important clinical considerations, though one priority may benefit from reconsideration. While laboratory values and symptoms provide useful context, the most critical elements for this scenario involve understanding the anatomical risk and the patient's wishes for care.",
          knownOutcomes: "Partial risk assessment without clear goals of care documentation can lead to reactive rather than proactive crisis management. Families report greater distress when emergency situations arise without prior planning.",
          thinkingPattern: "Your reasoning demonstrates attention to clinical details. Consider how chart information directly informs the most immediate decisions about hemorrhage preparedness and response.",
          reasoningTrace: "CBC provides general health context, but the critical question is: What would we do if significant bleeding occurs? This requires knowing both the anatomical risk and the patient's preferences.",
          evidenceAnchors: [
            { title: "Anticipatory Planning in Palliative Oncology", citation: "Palliative Medicine, 2021" },
          ],
        },
        C: {
          rationale: "The selected priorities may not optimally address the clinical urgency of this situation. The chronic bleeding pattern with a head/neck tumor raises specific concerns about hemorrhage risk that require targeted assessment.",
          knownOutcomes: "Without clear documentation of vascular involvement and goals of care, clinical teams may be unprepared for sudden deterioration. Families report feeling abandoned when crisis events occur without prior discussion.",
          thinkingPattern: "Consider what specific information would change your immediate clinical approach. General health indicators are valuable, but this scenario calls for focused risk assessment and care planning.",
          reasoningTrace: "Chronic oozing from tumor site + location near major vessels + no palliative consultation = High-priority need for risk stratification and advance planning, not general health monitoring.",
          evidenceAnchors: [
            { title: "Emergency Preparedness in Home Palliative Care", citation: "BMC Palliative Care, 2020" },
          ],
        },
      },
      correctCombination: ["q1-a", "q1-d"],
    },
    {
      id: "q2",
      questionNumber: 2,
      stem: "Based on Adam's current status, which two immediate nursing assessments are most important?",
      options: [
        {
          id: "q2-a",
          label: "A",
          text: "Detailed wound measurement and staging",
          score: 2,
          feedbackIfSelected: "Useful for documentation but not the most urgent priority.",
        },
        {
          id: "q2-b",
          label: "B",
          text: "Assessment of current bleeding characteristics and hemodynamic stability",
          score: 5,
          feedbackIfSelected: "Critical for immediate safety evaluation.",
        },
        {
          id: "q2-c",
          label: "C",
          text: "Evaluation of family's understanding and coping capacity",
          score: 5,
          feedbackIfSelected: "Essential for home-based care planning and support.",
        },
        {
          id: "q2-d",
          label: "D",
          text: "Review of Adam's daily activity tolerance",
          score: 1,
          feedbackIfSelected: "General functional assessment, not specific to current concern.",
        },
        {
          id: "q2-e",
          label: "E",
          text: "Assessment of nutritional status and weight trends",
          score: 1,
          feedbackIfSelected: "Important for overall care but not the immediate priority.",
        },
      ],
      clusterFeedback: {
        A: {
          rationale: "Excellent prioritization. You correctly identified that immediate safety assessment (bleeding and hemodynamics) combined with family capacity evaluation are the two most critical nursing assessments for this home-based care situation.",
          knownOutcomes: "Studies show that comprehensive family assessment is as important as clinical assessment for successful home palliative care. Families who feel prepared and supported report better coping during crisis events.",
          thinkingPattern: "Your approach integrates clinical urgency with the psychosocial realities of home care. You recognize that Adam's safety depends on both his physiological stability and his family's capacity to respond.",
          reasoningTrace: "Home setting + bleeding wound + family checking dressings frequently → Must assess both clinical status AND family's ability to manage the situation safely.",
          evidenceAnchors: [
            { title: "Family Caregiver Assessment in Palliative Care", citation: "JPSM, 2022" },
            { title: "Home-Based Palliative Care Nursing Standards", citation: "HPNA, 2021" },
          ],
        },
        B: {
          rationale: "Good clinical thinking with one priority that may need refinement. Consider which assessments are most directly relevant to the presenting concern and the care setting.",
          knownOutcomes: "Focused assessment on the presenting concern and family capacity yields more actionable information for home care planning.",
          thinkingPattern: "Your reasoning shows attention to clinical detail. In home palliative care, family assessment is often as critical as patient assessment.",
          reasoningTrace: "Consider: What information do I need to ensure safe care TODAY in this HOME environment?",
          evidenceAnchors: [
            { title: "Nursing Assessment Priorities in Community Palliative Care", citation: "International Journal of Palliative Nursing, 2020" },
          ],
        },
        C: {
          rationale: "The selected priorities may benefit from reconsideration. While thorough documentation is important, the immediate concern is assessing current safety and support capacity.",
          knownOutcomes: "Delayed recognition of hemorrhage risk or inadequate family preparation can result in emergency admissions that conflict with patient preferences.",
          thinkingPattern: "Prioritize assessments that directly inform your immediate care decisions and safety planning.",
          reasoningTrace: "Chronic bleeding + anxious family + patient wishes to stay home → Focus on bleeding status NOW and family's capacity to continue home care.",
          evidenceAnchors: [
            { title: "Risk Assessment in Home Palliative Care", citation: "Palliative Medicine, 2021" },
          ],
        },
      },
      correctCombination: ["q2-b", "q2-c"],
    },
    {
      id: "q3",
      questionNumber: 3,
      stem: "What two elements should be prioritized in the care plan discussion with Adam and his family?",
      options: [
        {
          id: "q3-a",
          label: "A",
          text: "Preparation for potential hemorrhage event including comfort measures and emergency response",
          score: 5,
          feedbackIfSelected: "Critical for anticipatory planning in this high-risk situation.",
        },
        {
          id: "q3-b",
          label: "B",
          text: "Referral to oncology for reassessment of treatment options",
          score: 1,
          feedbackIfSelected: "May be appropriate but not the immediate priority given current clinical picture.",
        },
        {
          id: "q3-c",
          label: "C",
          text: "Discussion of palliative care consultation for symptom management and support",
          score: 5,
          feedbackIfSelected: "Essential given current status and documented gap in palliative involvement.",
        },
        {
          id: "q3-d",
          label: "D",
          text: "Scheduling regular wound care visits for dressing optimization",
          score: 2,
          feedbackIfSelected: "Helpful but secondary to the more urgent planning needs.",
        },
        {
          id: "q3-e",
          label: "E",
          text: "Dietary consultation for nutritional support",
          score: 1,
          feedbackIfSelected: "Valuable for general care but not the current priority.",
        },
      ],
      clusterFeedback: {
        A: {
          rationale: "Excellent care planning priorities. You correctly identified that hemorrhage preparedness and palliative care consultation are the two most critical elements for Adam's care plan at this time.",
          knownOutcomes: "Proactive hemorrhage planning reduces family trauma during acute events. Palliative care involvement improves symptom management, family support, and alignment of care with patient values.",
          thinkingPattern: "Your approach demonstrates understanding of anticipatory care planning and appropriate resource utilization. You recognize that no palliative consultation has occurred despite advanced disease and complex symptom management needs.",
          reasoningTrace: "High hemorrhage risk + patient wants to stay home + no palliative care yet → Must prepare for potential crisis AND engage appropriate specialty support.",
          evidenceAnchors: [
            { title: "Anticipatory Hemorrhage Planning", citation: "Journal of Hospice & Palliative Nursing, 2021" },
            { title: "Early Palliative Care Referral Benefits", citation: "NEJM, 2010" },
            { title: "Crisis Management in Home Palliative Care", citation: "BMC Palliative Care, 2022" },
          ],
        },
        B: {
          rationale: "Your selections include relevant care elements, though the priorities may benefit from reconsideration. Consider what Adam's current PPS and expressed preferences suggest about the most appropriate focus of care.",
          knownOutcomes: "Care plans that align with patient's functional status and stated preferences result in higher satisfaction and fewer unwanted interventions.",
          thinkingPattern: "Consider the documented gap in palliative care involvement and the specific risks associated with Adam's tumor location and bleeding pattern.",
          reasoningTrace: "PPS 40% + chronic bleeding + no palliative consultation + wants to stay home → Focus on crisis preparedness and appropriate specialty involvement.",
          evidenceAnchors: [
            { title: "Integrating Palliative Care in Oncology", citation: "ASCO Guidelines, 2022" },
          ],
        },
        C: {
          rationale: "The selected priorities may not optimally address the most urgent care planning needs. Adam's situation requires specific attention to hemorrhage risk and palliative care involvement.",
          knownOutcomes: "Without anticipatory planning for hemorrhage and palliative care support, families often face crisis situations unprepared, leading to emergency interventions that may conflict with patient wishes.",
          thinkingPattern: "What are the most likely near-term challenges, and what resources are currently missing from Adam's care team?",
          reasoningTrace: "Chronic tumor bleeding near major vessels + anxious family + PPS 40% + NO palliative care = Urgent need for crisis planning and specialty support.",
          evidenceAnchors: [
            { title: "Care Gaps in Community Oncology", citation: "Journal of Oncology Practice, 2021" },
          ],
        },
      },
      correctCombination: ["q3-a", "q3-c"],
    },
  ],
  ipInsights: [
    {
      id: "ip-nurse",
      role: "nurse",
      title: "Home Care Nurse Perspective",
      perspective: "I've been visiting Adam twice weekly for wound care. The family is becoming increasingly anxious about the bleeding—they're checking the dressing multiple times a day. I've noticed they're exhausted and I'm concerned about their sustainability as caregivers. Adam himself seems more withdrawn lately, and I wonder if he's processing his prognosis. We need to have an honest conversation about what might happen and ensure they feel prepared.",
      keyInsights: [
        "Family anxiety is escalating with repeated dressing checks",
        "Caregiver fatigue is becoming apparent",
        "Patient may be emotionally processing disease progression",
        "Need for open discussion about potential complications",
      ],
    },
    {
      id: "ip-aide",
      role: "care_aide",
      title: "Personal Support Worker Perspective",
      perspective: "I help Adam with bathing and personal care three times a week. He's been more fatigued recently and needs more assistance than before. During our visits, he's shared that he's worried about being a burden to his family. He mentioned wanting to 'go peacefully at home' if his time comes. I think this information is important for the care team to know.",
      keyInsights: [
        "Functional decline with increased care needs",
        "Patient expresses concern about burdening family",
        "Clear preference for peaceful death at home",
        "Important values information for care planning",
      ],
    },
    {
      id: "ip-wound",
      role: "wound_specialist",
      title: "Wound Care Specialist Perspective",
      perspective: "The tumor has eroded through the skin and there's visible vascularity in the wound bed. Given the tumor's proximity to the carotid artery, I'm concerned about the risk of significant hemorrhage. The current dressings are managing the oozing adequately, but we should discuss what to do if bleeding escalates. I recommend having dark towels and sedative medications available as part of a hemorrhage kit.",
      keyInsights: [
        "Tumor erosion with visible vascularity in wound bed",
        "Proximity to carotid artery raises hemorrhage risk",
        "Current dressings managing chronic ooze",
        "Hemorrhage kit recommended as precautionary measure",
      ],
    },
    {
      id: "ip-mrp",
      role: "mrp",
      title: "Most Responsible Practitioner Perspective",
      perspective: "Adam's disease is progressing and his PPS of 40% indicates significant decline. Given the tumor location and chronic bleeding, we need to have a frank goals of care conversation. If he wants to remain at home, we need palliative care involvement for symptom management and crisis planning. The family needs to understand what a hemorrhage event might look like and what our response would be based on Adam's wishes.",
      keyInsights: [
        "Disease progression with declining functional status",
        "Goals of care conversation urgently needed",
        "Palliative care consultation should be initiated",
        "Family education about potential hemorrhage is critical",
      ],
    },
  ],
  badgeThresholds: {
    standard: 21, // 3 questions × 7 points minimum to pass
    premium: 30,  // 3 questions × 10 points for perfect score
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
