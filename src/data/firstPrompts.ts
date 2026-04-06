// Contextual first prompts.
// In a production system these would be computed from actual data anomalies.
// For this prototype, static conditions drive the matching logic.

export interface ContextualPrompt {
  id: string;
  message: string;         // The prompt card text, e.g. "Revenue is down 12% this week"
  suggestions: string[];   // Suggested follow-up queries
}

export interface DefaultPrompt {
  label: string;
  query: string;           // The query sent when tapped
}

export const contextualPrompts: ContextualPrompt[] = [
  {
    id: 'rev_decline',
    message: 'Revenue is down 12% this week — want to explore what caused it?',
    suggestions: ['Break down by region', 'Compare to last week', 'Which product tier dropped most?'],
  },
  {
    id: 'user_surge',
    message: 'New user signups are up 28% today — likely from the recent campaign launch.',
    suggestions: ['Track where they came from', 'Which plan are they choosing?', 'Onboarding completion rate'],
  },
];

export const defaultPrompts: DefaultPrompt[] = [
  { label: 'Revenue trend this quarter', query: 'Q1 revenue breakdown by region' },
  { label: 'User retention analysis', query: 'User retention analysis this quarter' },
  { label: 'Top conversion channels', query: 'Which channels drive the most conversions?' },
  { label: 'Marketing performance', query: 'Marketing campaign performance this quarter' },
  { label: 'Sales pipeline health', query: 'Sales pipeline overview' },
  { label: 'Lead source breakdown', query: 'Lead source breakdown by channel' },
  { label: 'Rep quota attainment', query: 'Sales rep quota attainment' },
  { label: 'Product tier comparison', query: 'Product tier performance comparison' },
];
