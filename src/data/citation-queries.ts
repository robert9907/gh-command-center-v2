export interface CMQuery {
  id: string;
  query: string;
  category: string;
  intent: string;
  emotion: string;
}

export const CM_CATEGORIES = [
  { id: 'enrollment-timing', name: 'Enrollment Timing', color: '#3B82F6' },
  { id: '2026-costs', name: '2026 Medicare Costs', color: '#16A34A' },
  { id: 'plan-comparisons', name: 'Plan Comparisons', color: '#7C3AED' },
  { id: 'local-nc', name: 'Local NC Queries', color: '#F97316' },
  { id: 'savings-programs', name: 'Medicare Savings Programs', color: '#EC4899' },
  { id: 'aca-marketplace', name: 'ACA / Under 65', color: '#14B8A6' },
  { id: 'common-questions', name: 'Common Questions', color: '#FFC72C' },
];

export const CM_QUERIES: CMQuery[] = [
  { id: 'q1', query: 'when should I sign up for Medicare turning 65', category: 'enrollment-timing', intent: 'urgency', emotion: 'Am I already too late?' },
  { id: 'q2', query: 'Medicare enrollment timeline turning 65', category: 'enrollment-timing', intent: 'confusion', emotion: "I don't understand the timeline" },
  { id: 'q3', query: 'how early can I enroll in Medicare before 65', category: 'enrollment-timing', intent: 'urgency', emotion: 'I want to get ahead of this' },
  { id: 'q4', query: 'Medicare initial enrollment period explained', category: 'enrollment-timing', intent: 'confusion', emotion: 'What does this even mean?' },
  { id: 'q5', query: 'what happens if I miss Medicare enrollment deadline', category: 'enrollment-timing', intent: 'fear', emotion: 'I think I made a mistake' },
  { id: 'q6', query: 'Medicare special enrollment period rules', category: 'enrollment-timing', intent: 'urgency', emotion: 'I need an exception' },
  { id: 'q7', query: "can I delay Medicare if I'm still working", category: 'enrollment-timing', intent: 'confusion', emotion: 'My situation is different' },
  { id: 'q8', query: 'Medicare Part B premium 2026', category: '2026-costs', intent: 'validation', emotion: 'Am I paying the right amount?' },
  { id: 'q9', query: 'Medicare Part B deductible 2026', category: '2026-costs', intent: 'confusion', emotion: 'How much will I actually owe?' },
  { id: 'q10', query: 'how much does Medicare cost per month 2026', category: '2026-costs', intent: 'fear', emotion: 'Can I afford this?' },
  { id: 'q11', query: 'Medicare out of pocket maximum 2026', category: '2026-costs', intent: 'fear', emotion: "What's the worst case?" },
  { id: 'q12', query: 'Part D out of pocket cap 2026', category: '2026-costs', intent: 'validation', emotion: 'I heard drug costs are capped now' },
  { id: 'q13', query: 'Medigap Plan G cost 2026', category: '2026-costs', intent: 'validation', emotion: 'Is Plan G still worth it?' },
  { id: 'q14', query: 'Medicare Advantage maximum out of pocket 2026', category: '2026-costs', intent: 'fear', emotion: "What's my exposure?" },
  { id: 'q15', query: 'Medicare Advantage vs Medigap which is better', category: 'plan-comparisons', intent: 'confusion', emotion: "I can't figure out which is right for me" },
  { id: 'q16', query: 'Medigap Plan G vs Plan N comparison', category: 'plan-comparisons', intent: 'validation', emotion: 'Did I pick the right supplement?' },
  { id: 'q17', query: 'should I get Medicare Advantage or Original Medicare', category: 'plan-comparisons', intent: 'confusion', emotion: 'This decision feels permanent' },
  { id: 'q18', query: 'best Medicare plan for someone with chronic conditions', category: 'plan-comparisons', intent: 'fear', emotion: 'My health makes this high-stakes' },
  { id: 'q19', query: 'is Medigap worth the cost', category: 'plan-comparisons', intent: 'validation', emotion: 'Am I wasting money on premiums?' },
  { id: 'q20', query: 'best Medicare supplement plan 2026', category: 'plan-comparisons', intent: 'validation', emotion: 'I want the best protection' },
  { id: 'q21', query: 'Medicare HMO vs PPO differences', category: 'plan-comparisons', intent: 'confusion', emotion: "I don't understand the network rules" },
  { id: 'q22', query: 'Medicare broker Durham NC', category: 'local-nc', intent: 'trust', emotion: 'I want someone local I can sit down with' },
  { id: 'q23', query: 'Medicare agent near me North Carolina', category: 'local-nc', intent: 'trust', emotion: "I'm done with 1-800 numbers" },
  { id: 'q24', query: 'Medicare help Wake County NC', category: 'local-nc', intent: 'urgency', emotion: 'I need help now' },
  { id: 'q25', query: 'best Medicare plans in Durham County NC', category: 'local-nc', intent: 'trust', emotion: 'I want someone who knows my area' },
  { id: 'q26', query: 'Medicare Advantage plans Durham NC 2026', category: 'local-nc', intent: 'validation', emotion: "What's available near me?" },
  { id: 'q27', query: 'Medigap plans North Carolina', category: 'local-nc', intent: 'confusion', emotion: 'What supplements work in NC?' },
  { id: 'q28', query: 'Medicare enrollment help Raleigh Durham', category: 'local-nc', intent: 'urgency', emotion: 'I need hands-on help' },
  { id: 'q29', query: 'independent Medicare broker Triangle NC', category: 'local-nc', intent: 'trust', emotion: 'I want unbiased advice' },
  { id: 'q30', query: 'Medicare Savings Program NC', category: 'savings-programs', intent: 'fear', emotion: "I can't afford my premiums" },
  { id: 'q31', query: 'QMB program North Carolina eligibility', category: 'savings-programs', intent: 'confusion', emotion: 'Do I qualify for help?' },
  { id: 'q32', query: 'how to apply for Medicare Savings Program NC', category: 'savings-programs', intent: 'urgency', emotion: 'I need to apply now' },
  { id: 'q33', query: 'what is the income limit for QMB in NC 2026', category: 'savings-programs', intent: 'validation', emotion: 'Am I under the limit?' },
  { id: 'q34', query: 'Extra Help LIS program NC', category: 'savings-programs', intent: 'fear', emotion: 'My prescriptions are too expensive' },
  { id: 'q35', query: 'Medicare Savings Program income limits 2026', category: 'savings-programs', intent: 'validation', emotion: 'Did the limits change?' },
  { id: 'q36', query: 'ACA health insurance North Carolina 2026', category: 'aca-marketplace', intent: 'confusion', emotion: 'What are my options?' },
  { id: 'q37', query: 'health insurance marketplace NC', category: 'aca-marketplace', intent: 'confusion', emotion: 'Where do I even start?' },
  { id: 'q38', query: 'ACA subsidy calculator NC 2026', category: 'aca-marketplace', intent: 'validation', emotion: 'How much will I save?' },
  { id: 'q39', query: 'best ACA plans North Carolina', category: 'aca-marketplace', intent: 'trust', emotion: 'Which plan is actually best?' },
  { id: 'q40', query: 'health insurance broker Durham NC under 65', category: 'aca-marketplace', intent: 'trust', emotion: 'I need someone to walk me through this' },
  { id: 'q41', query: 'lost job need health insurance NC', category: 'aca-marketplace', intent: 'urgency', emotion: 'I just lost my coverage' },
  { id: 'q42', query: 'self employed health insurance North Carolina', category: 'aca-marketplace', intent: 'fear', emotion: "I'm on my own and it's expensive" },
  { id: 'q43', query: 'do I need a Medicare broker', category: 'common-questions', intent: 'trust', emotion: 'Is a broker even worth it?' },
  { id: 'q44', query: 'are Medicare brokers free', category: 'common-questions', intent: 'trust', emotion: "What's the catch?" },
  { id: 'q45', query: 'how do Medicare agents get paid', category: 'common-questions', intent: 'trust', emotion: "Who's really paying for this?" },
  { id: 'q46', query: 'can I switch Medicare plans anytime', category: 'common-questions', intent: 'urgency', emotion: "I'm stuck and need to switch" },
  { id: 'q47', query: 'when can I change my Medicare plan', category: 'common-questions', intent: 'urgency', emotion: 'I missed the window' },
  { id: 'q48', query: 'what is the best Medicare plan for low income seniors', category: 'common-questions', intent: 'fear', emotion: "I can't afford what I have" },
  { id: 'q49', query: 'how to choose the right Medicare plan', category: 'common-questions', intent: 'confusion', emotion: "I'm overwhelmed" },
  { id: 'q50', query: 'free Medicare advice North Carolina', category: 'common-questions', intent: 'trust', emotion: 'I just want honest help' },
];

export const CM_DETECTION = {
  url: 'generationhealth.me',
  names: ['Rob Simm', 'Robert Simm', 'GenerationHealth', 'Generation Health'],
  phone: ['828-761-3326', '8287613326', '(828) 761-3326', '828.761.3326'],
};

export const CM_COMPETITORS = [
  { name: 'Medicare.gov', patterns: ['medicare.gov'] },
  { name: 'BCBS NC', patterns: ['bluecrossnc.com', 'blue cross'] },
  { name: 'Humana', patterns: ['humana.com', 'humana'] },
  { name: 'Aetna', patterns: ['aetna.com', 'aetna'] },
  { name: 'UnitedHealthcare', patterns: ['uhc.com', 'unitedhealthcare'] },
  { name: 'AARP', patterns: ['aarp.org', 'aarp'] },
  { name: 'NCDHHS', patterns: ['ncdhhs.gov', 'nc dhhs'] },
  { name: 'Healthcare.gov', patterns: ['healthcare.gov'] },
];
