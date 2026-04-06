import type {
  MessageBlock,
  InterpretationCard,
  InterpretationChip,
  TrustLayer,
  SuggestionItem,
} from './types';
import { chartData } from './chartData';

// --- Block factories ---
const textBlock = (content: string): MessageBlock => ({ type: 'text', content });
const tableBlock = (headers: string[], rows: (string | number)[][]): MessageBlock => ({
  type: 'table',
  table: { headers, rows },
});
const makeChart = (
  type: 'line' | 'bar' | 'pie',
  title: string,
  subtitle: string,
  dataKey: string,
  nameKey: string,
  dataName: keyof typeof chartData,
): MessageBlock => ({
  type: 'chart',
  chart: {
    type,
    title,
    subtitle,
    dataKey,
    nameKey,
    data: chartData[dataName],
  },
});

// --- Interpretation card helpers ---
const makeCard = (
  chips: InterpretationChip[],
  summary: string,
  primaryChartBlockIndex: number,
): InterpretationCard => ({ id: `ic-${Math.random().toString(36).slice(2, 7)}`, chips, summary, primaryChartBlockIndex });

const chip = (id: string, type: InterpretationChip['type'], label: string, value: string, editable = false): InterpretationChip => ({
  id, type, label, value, editable,
});

// --- Trust layer helpers ---
const tl = (
  metrics: Array<{ name: string; definition: string; formula?: string }>,
  filters: Array<{ field: string; operator: string; value: string }>,
  freshness: { lastUpdated: string; range: string; source: string },
  reasoning?: string,
): TrustLayer => ({ metricDefinitions: metrics, filters, dataFreshness: freshness, reasoning });

// --- Suggestion helpers ---
const sug = (id: string, label: string, type: SuggestionItem['type'] = 'suggestion'): SuggestionItem => ({ id, label, type });

// --- Response shape ---
export interface MockResponse {
  blocks: MessageBlock[];
  thinkingMs: [number, number];
  interpretationCard?: InterpretationCard;
  trustLayer?: TrustLayer;
  suggestions: SuggestionItem[];
}

export const mockResponses: Record<string, MockResponse> = {

  'revenue': {
    thinkingMs: [1200, 2000],
    blocks: [
      textBlock(
        `Your revenue has grown **34.2% year-over-year**, reaching $1.05M in 2024. The strongest growth came in Q4 with a particularly strong November, likely driven by your holiday campaign and new enterprise onboarding.\n\nThe month-over-month trajectory shows consistent growth with a slight dip in August, which aligns with typical summer slowdowns in B2B. December's $92.1K represents your highest single month, and the trend suggests you're well-positioned for continued growth into Q1 2025.`
      ),
      tableBlock(
        ['Month', 'Revenue', 'New Users', 'MoM Growth'],
        [
          ['Sep', '$71,600', '2,450', '+4.9%'],
          ['Oct', '$78,900', '2,680', '+10.2%'],
          ['Nov', '$85,400', '2,810', '+8.2%'],
          ['Dec', '$92,100', '3,140', '+7.8%'],
        ]
      ),
      makeChart('line', 'Monthly Revenue Trend', '2024 full year', 'value', 'name', 'monthlyRevenue'),
    ],
    interpretationCard: makeCard(
      [chip('m1', 'metric', 'Revenue', 'revenue'), chip('d1', 'dimension', 'by Month', 'month', true), chip('t1', 'time_range', 'Full year 2024', '2024', true)],
      'Revenue → by Month → Full year 2024',
      2,
    ),
    trustLayer: tl(
      [{ name: 'Revenue', definition: 'Total revenue from all paid plans in USD', formula: 'SUM(order_amount)' }],
      [{ field: 'Year', operator: 'equals', value: '2024' }],
      { lastUpdated: '2024-12-31T23:59:00Z', range: 'Jan 2024 – Dec 2024', source: 'Stripe + Salesforce CRM' },
      'Line chart chosen to show month-over-month revenue trajectory with clear trend direction.',
    ),
    suggestions: [
      sug('s1', 'Break down by region'),
      sug('s2', 'Compare to last year'),
      sug('s3', 'Why the August dip?'),
    ],
  },

  'regional': {
    thinkingMs: [800, 1500],
    blocks: [
      textBlock(
        `Here's the regional breakdown of your sales performance. **Asia Pacific is your fastest-growing market** at 24.5% growth, while **Middle East shows the strongest momentum** at 31.2% despite starting from a smaller base.\n\nNorth America remains your largest market at $342K, representing 41% of total revenue. Europe's steady 12.7% growth is solid, though it's being outpaced by emerging markets. Latin America's 8.3% growth is below target and may warrant a strategic review.`
      ),
      makeChart('bar', 'Revenue by Region', 'Full year 2024', 'value', 'name', 'regionalSales'),
      tableBlock(
        ['Region', 'Revenue', 'YoY Growth'],
        [
          ['North America', '$342,000', '+18.2%'],
          ['Europe', '$218,000', '+12.7%'],
          ['Asia Pacific', '$187,000', '+24.5%'],
          ['Latin America', '$94,000', '+8.3%'],
          ['Middle East', '$67,000', '+31.2%'],
        ]
      ),
    ],
    interpretationCard: makeCard(
      [chip('m1', 'metric', 'Revenue', 'revenue'), chip('d1', 'dimension', 'by Region', 'region'), chip('t1', 'time_range', 'Full year 2024', '2024', true)],
      'Revenue → by Region → Full year 2024',
      1,
    ),
    trustLayer: tl(
      [{ name: 'Revenue', definition: 'Total contracted revenue attributed to geographic region based on customer billing address' }],
      [{ field: 'Year', operator: 'equals', value: '2024' }],
      { lastUpdated: '2024-12-31T23:59:00Z', range: 'Jan 2024 – Dec 2024', source: 'Salesforce CRM' },
      'Bar chart selected to enable direct comparison across regions of different sizes.',
    ),
    suggestions: [
      sug('s1', 'Swap to margin by region'),
      sug('s2', 'Deep dive on Asia Pacific'),
      sug('s3', 'What drives Latin America underperformance?'),
    ],
  },

  'retention': {
    thinkingMs: [1000, 1800],
    blocks: [
      textBlock(
        `Your user retention shows a typical decay pattern, but the **long-term retention at 31% after 12 weeks** is above the industry average of ~20% for SaaS products. The steepest drop-off is between Week 1 and Week 2 (28% loss), which typically indicates friction in the early onboarding experience.\n\nThe good news: once users survive past Week 4, retention stabilizes significantly. Users who reach 6 weeks show very high long-term retention. Consider investing in early engagement triggers during that critical first week.`
      ),
      makeChart('line', 'User Retention Curve', '% of users retained over time', 'retention', 'name', 'userRetention'),
    ],
    interpretationCard: makeCard(
      [chip('m1', 'metric', 'Retention', 'retention'), chip('d1', 'dimension', 'by Week', 'week'), chip('t1', 'time_range', '2024 Cohort', '2024', true)],
      'Retention → by Week → 2024 Cohort',
      1,
    ),
    trustLayer: tl(
      [
        { name: 'Retention Rate', definition: 'Percentage of users who remain active N weeks after signup', formula: '(Users active at week N / Users who signed up week 0) × 100' },
      ],
      [{ field: 'Cohort', operator: 'equals', value: '2024 signups' }],
      { lastUpdated: '2024-12-31T23:59:00Z', range: 'Jan 2024 – Dec 2024', source: 'Internal analytics DB' },
      'Line chart chosen to show the classic retention decay curve with clear inflection points.',
    ),
    suggestions: [
      sug('s1', 'Retention by plan tier'),
      sug('s2', 'What drives the Week 2 drop-off?'),
      sug('s3', 'Compare to last year cohort'),
    ],
  },

  'channels': {
    thinkingMs: [900, 1600],
    blocks: [
      textBlock(
        `Your conversion rate by channel reveals some interesting insights. **Organic Search is your top performer** at 38% of conversions, which is excellent and indicates strong SEO health. Paid Ads convert well at 24%, but the CPA should be monitored closely.\n\nSocial Media's 19% is slightly above average, though it may fluctuate with algorithm changes. Email marketing's 12% is solid for existing leads. Direct traffic's 7% suggests brand awareness could be stronger — consider investing in PR and thought leadership content.`
      ),
      makeChart('pie', 'Conversions by Channel', '% of total conversions', 'value', 'name', 'conversionsByChannel'),
      tableBlock(
        ['Channel', 'Conversion %', 'Quality Score'],
        [
          ['Organic Search', '38%', 'High'],
          ['Paid Ads', '24%', 'Medium'],
          ['Social Media', '19%', 'Medium'],
          ['Email', '12%', 'High'],
          ['Direct', '7%', 'High'],
        ]
      ),
    ],
    interpretationCard: makeCard(
      [chip('m1', 'metric', 'Conversions', 'conversions'), chip('d1', 'dimension', 'by Channel', 'channel'), chip('t1', 'time_range', 'Full year 2024', '2024', true)],
      'Conversions → by Channel → Full year 2024',
      1,
    ),
    trustLayer: tl(
      [{ name: 'Conversion', definition: 'A visitor who completes a desired goal (signup, upgrade, or purchase)' }],
      [{ field: 'Year', operator: 'equals', value: '2024' }],
      { lastUpdated: '2024-12-31T23:59:00Z', range: 'Jan 2024 – Dec 2024', source: 'Google Analytics + HubSpot' },
      'Pie chart chosen to show proportional contribution of each channel to total conversions.',
    ),
    suggestions: [
      sug('s1', 'Break down by conversion quality'),
      sug('s2', 'CPA by channel'),
      sug('s3', 'How does this compare to last quarter?'),
    ],
  },

  'users': {
    thinkingMs: [1100, 1900],
    blocks: [
      textBlock(
        `Your user base grew to **3,140 monthly active users** in December, up from 1,240 in January — that's a **153% increase** over the year. The average user count across 2024 was 1,958 MAU.\n\nWeekday usage significantly outpaces weekends (avg 9,464 vs 6,980), which is typical for B2B tools. Thursday is your peak day with 10,200 active users. Consider scheduling feature announcements and emails for Tuesday/Wednesday to maximize engagement during your highest-traffic periods.`
      ),
      makeChart('bar', 'Weekly Active Users', 'Average daily users by day of week', 'users', 'name', 'weeklyActiveUsers'),
    ],
    interpretationCard: makeCard(
      [chip('m1', 'metric', 'Active Users', 'users'), chip('d1', 'dimension', 'by Day of Week', 'day'), chip('t1', 'time_range', 'Full year 2024', '2024', true)],
      'Active Users → by Day of Week → Full year 2024',
      1,
    ),
    trustLayer: tl(
      [{ name: 'Monthly Active Users (MAU)', definition: 'Unique users who performed at least one action in a 30-day window', formula: 'COUNT(DISTINCT user_id WHERE activity_date >= DATE_SUB(CURRENT_DATE, 30))' }],
      [{ field: 'Year', operator: 'equals', value: '2024' }],
      { lastUpdated: '2024-12-31T23:59:00Z', range: 'Jan 2024 – Dec 2024', source: 'Internal analytics DB' },
      'Bar chart chosen to contrast weekday vs weekend usage patterns clearly.',
    ),
    suggestions: [
      sug('s1', 'MAU trend over time'),
      sug('s2', 'User growth by plan tier'),
      sug('s3', 'What drives the Thursday peak?'),
    ],
  },

  'product': {
    thinkingMs: [1000, 1700],
    blocks: [
      textBlock(
        `Your product tier performance shows clear monetization efficiency. **Enterprise dominates revenue** at $284K but serves only 184 customers — a $1,543 average revenue per user. This is your highest-value segment and should be prioritized for expansion revenue.\n\nPro tier is your volume leader with 1,240 users generating $156K ($126/user). The 2,890 Starter users contribute $48K ($17/user), serving as a strong conversion funnel. Your 8,420 Free Trial users represent significant upside if conversion rates improve.`
      ),
      tableBlock(
        ['Tier', 'Revenue', 'Users', 'ARPU'],
        [
          ['Enterprise', '$284,000', '184', '$1,543'],
          ['Pro', '$156,000', '1,240', '$126'],
          ['Starter', '$48,000', '2,890', '$17'],
          ['Free Trial', '$12,400', '8,420', '$1.47'],
        ]
      ),
      makeChart('bar', 'Revenue by Product Tier', 'Full year 2024', 'value', 'name', 'productPerformance'),
    ],
    interpretationCard: makeCard(
      [chip('m1', 'metric', 'Revenue', 'revenue'), chip('d1', 'dimension', 'by Tier', 'tier'), chip('t1', 'time_range', 'Full year 2024', '2024', true)],
      'Revenue → by Tier → Full year 2024',
      2,
    ),
    trustLayer: tl(
      [
        { name: 'Revenue', definition: 'Total recurring revenue by plan tier in USD' },
        { name: 'ARPU', definition: 'Average Revenue Per User — total revenue divided by active users in tier', formula: 'Revenue / Active Users' },
      ],
      [{ field: 'Year', operator: 'equals', value: '2024' }],
      { lastUpdated: '2024-12-31T23:59:00Z', range: 'Jan 2024 – Dec 2024', source: 'Stripe + Internal DB' },
      'Bar chart chosen to compare revenue contribution across tiers of very different user volumes.',
    ),
    suggestions: [
      sug('s1', 'Show users instead of revenue'),
      sug('s2', 'ARPU by tier'),
      sug('s3', 'Free trial conversion rates'),
    ],
  },

  'marketing': {
    thinkingMs: [900, 1600],
    blocks: [
      textBlock(
        `Your marketing investment showed strong returns in 2024. **Total spend was $292K** generating **8,410 qualified leads** — a **cost per lead of $34.70**, which is below the industry average of ~$50 for B2B SaaS.\n\nNovember's Holiday Blitz was the standout campaign: $48K spend yielded 1,380 leads ($35 CPL) with a 6.4% CTR — your best-performing campaign of the year. The Spring Launch also delivered well with 890 conversions at a 4.2% CTR. Content-driven campaigns underperformed at 9% of lead volume, suggesting an opportunity to invest more in SEO and thought leadership.`
      ),
      tableBlock(
        ['Campaign', 'Clicks', 'Conversions', 'CTR'],
        [
          ['Product Launch', '31,200', '2,680', '8.6%'],
          ['Holiday Blitz', '42,100', '3,480', '8.3%'],
          ['Back to School', '15,800', '1,140', '7.2%'],
          ['New Year Reset', '18,600', '1,420', '7.6%'],
          ['Spring Launch', '12,400', '890', '7.2%'],
          ['Summer Promo', '8,900', '620', '7.0%'],
        ]
      ),
      makeChart('line', 'Marketing Spend vs Leads Generated', 'Full year 2024', 'leads', 'name', 'marketingSpendVsLeads'),
    ],
    interpretationCard: makeCard(
      [chip('m1', 'metric', 'Marketing Leads', 'leads'), chip('d1', 'dimension', 'by Month', 'month'), chip('t1', 'time_range', 'Full year 2024', '2024', true)],
      'Marketing Leads → by Month → Full year 2024',
      2,
    ),
    trustLayer: tl(
      [
        { name: 'Leads', definition: 'Marketing Qualified Leads (MQLs) — contacts meeting lead scoring thresholds' },
        { name: 'Cost Per Lead (CPL)', definition: 'Total marketing spend divided by MQLs generated', formula: 'Total Spend / MQLs' },
        { name: 'CTR', definition: 'Click-through rate — clicks divided by impressions', formula: 'Clicks / Impressions × 100' },
      ],
      [{ field: 'Year', operator: 'equals', value: '2024' }],
      { lastUpdated: '2024-12-31T23:59:00Z', range: 'Jan 2024 – Dec 2024', source: 'HubSpot + Google Ads' },
      'Line chart chosen to show the relationship between marketing spend and lead volume over time.',
    ),
    suggestions: [
      sug('s1', 'Break down by campaign'),
      sug('s2', 'Cost per lead trend'),
      sug('s3', 'Which campaign had the best ROI?'),
    ],
  },

  'leads': {
    thinkingMs: [800, 1500],
    blocks: [
      textBlock(
        `Lead generation totaled **8,410 leads** in 2024, with **3,120 MQLs** (37% qualification rate) and **1,240 SQLs** (40% of MQLs). Your overall conversion from lead to closed-won deal is **1.7%** — slightly below the 2-3% benchmark for mid-market SaaS.\n\n**Organic Search is your top lead source** at 31%, followed by Paid Search at 24% and Social Ads at 18%. The Referral channel, while smallest at 4%, has the highest conversion rate — consider formalizing a referral program to capitalize on this quality signal.`
      ),
      makeChart('pie', 'Lead Sources', '% of total leads', 'value', 'name', 'leadSources'),
      tableBlock(
        ['Source', '% of Leads', 'MQL Rate', 'Avg Deal Size'],
        [
          ['Organic Search', '31%', '42%', '$8,400'],
          ['Paid Search', '24%', '38%', '$7,200'],
          ['Social Ads', '18%', '35%', '$6,800'],
          ['Email Campaigns', '14%', '44%', '$9,100'],
          ['Content / SEO', '9%', '40%', '$7,600'],
          ['Referrals', '4%', '58%', '$12,400'],
        ]
      ),
    ],
    interpretationCard: makeCard(
      [chip('m1', 'metric', 'Leads', 'leads'), chip('d1', 'dimension', 'by Source', 'source'), chip('t1', 'time_range', 'Full year 2024', '2024', true)],
      'Leads → by Source → Full year 2024',
      1,
    ),
    trustLayer: tl(
      [
        { name: 'Lead', definition: 'Any contact captured through a marketing touchpoint' },
        { name: 'MQL Rate', definition: 'Percentage of leads meeting marketing-qualified criteria', formula: 'MQLs / Total Leads × 100' },
      ],
      [{ field: 'Year', operator: 'equals', value: '2024' }],
      { lastUpdated: '2024-12-31T23:59:00Z', range: 'Jan 2024 – Dec 2024', source: 'HubSpot CRM' },
      'Pie chart chosen to show proportional contribution of each lead source.',
    ),
    suggestions: [
      sug('s1', 'Lead volume trend over time'),
      sug('s2', 'MQL rate by source'),
      sug('s3', 'Referral program potential'),
    ],
  },

  'email': {
    thinkingMs: [700, 1300],
    blocks: [
      textBlock(
        `Email remains a high-impact channel. The **Onboarding sequence** is your strongest performer with a **71% open rate** and **12.3% CTR** — this is where your best conversion ROI lives. The Welcome Series also performs well at 62% open rate and 8.4% CTR.\n\n**Promotional emails are your weakest** at 28% open rate and 3.1% CTR — sending frequency may be contributing to list fatigue. Consider reducing promotional sends to once per week and A/B testing subject lines. The Re-engagement campaign's 18% open rate signals a segment that needs either a refreshed approach or cleanup from your active list.`
      ),
      makeChart('bar', 'Email Campaign Metrics', 'Open rate by campaign type', 'openRate', 'name', 'emailMetrics'),
      tableBlock(
        ['Campaign', 'Open Rate', 'CTR', 'Conversions'],
        [
          ['Onboarding', '71%', '12.3%', '342'],
          ['Welcome Series', '62%', '8.4%', '184'],
          ['Product Updates', '44%', '5.8%', '127'],
          ['Monthly Newsletter', '38%', '4.2%', '92'],
          ['Promotional', '28%', '3.1%', '68'],
          ['Re-engagement', '18%', '1.9%', '31'],
        ]
      ),
    ],
    interpretationCard: makeCard(
      [chip('m1', 'metric', 'Email Open Rate', 'openRate'), chip('d1', 'dimension', 'by Campaign', 'campaign'), chip('t1', 'time_range', 'Full year 2024', '2024', true)],
      'Email Open Rate → by Campaign → Full year 2024',
      1,
    ),
    trustLayer: tl(
      [
        { name: 'Open Rate', definition: 'Percentage of recipients who opened the email', formula: 'Unique Opens / Delivered × 100' },
        { name: 'CTR', definition: 'Click-through rate — unique clicks divided by delivered', formula: 'Unique Clicks / Delivered × 100' },
      ],
      [{ field: 'Year', operator: 'equals', value: '2024' }, { field: 'Type', operator: 'equals', value: 'Automated + Campaign' }],
      { lastUpdated: '2024-12-31T23:59:00Z', range: 'Jan 2024 – Dec 2024', source: 'Mailchimp + Intercom' },
      'Bar chart chosen to compare campaign performance across the most distinct campaign types.',
    ),
    suggestions: [
      sug('s1', 'Show CTR instead of open rate'),
      sug('s2', 'Conversion rate by campaign'),
      sug('s3', 'List health — unsubscribes over time'),
    ],
  },

  'pipeline': {
    thinkingMs: [900, 1600],
    blocks: [
      textBlock(
        `Your sales pipeline tells a story of efficient qualification. From **8,420 inbound leads**, you qualified **3,120 MQLs** (37%), converted to **1,240 SQLs** (40% of MQLs), and created **480 opportunities**. The **68% drop from MQL to SQL** is above the typical 50% benchmark, suggesting your MQL criteria may be too loose.\n\nOf 480 opportunities entered, **186 reached negotiation** (39%) and **142 closed won** — a **29.6% close rate on opportunities**, which is solid for mid-market SaaS. This yielded **$1.03M in closed revenue**, with an average deal size of **$7,254**. The funnel bottleneck is clearly between MQL and SQL — tightening lead scoring would improve overall efficiency.`
      ),
      makeChart('bar', 'Sales Pipeline Funnel', 'Full year 2024', 'value', 'name', 'salesPipeline'),
      tableBlock(
        ['Stage', 'Volume', 'Conversion Rate'],
        [
          ['Leads', '8,420', '—'],
          ['MQLs', '3,120', '37%'],
          ['SQLs', '1,240', '40%'],
          ['Opportunities', '480', '39%'],
          ['Negotiation', '186', '38%'],
          ['Closed Won', '142', '76%'],
        ]
      ),
    ],
    interpretationCard: makeCard(
      [chip('m1', 'metric', 'Pipeline Volume', 'value'), chip('d1', 'dimension', 'by Stage', 'stage'), chip('t1', 'time_range', 'Full year 2024', '2024', true)],
      'Pipeline Volume → by Stage → Full year 2024',
      1,
    ),
    trustLayer: tl(
      [
        { name: 'Conversion Rate', definition: 'Percentage of opportunities advancing to the next stage', formula: 'Stage N+1 Volume / Stage N Volume × 100' },
        { name: 'Close Rate', definition: 'Closed Won divided by total Opportunities', formula: 'Closed Won / Opportunities × 100' },
      ],
      [{ field: 'Year', operator: 'equals', value: '2024' }],
      { lastUpdated: '2024-12-31T23:59:00Z', range: 'Jan 2024 – Dec 2024', source: 'Salesforce CRM' },
      'Bar chart chosen to visualize the funnel shape and identify the biggest drop-off stage.',
    ),
    suggestions: [
      sug('s1', 'Value-weighted funnel'),
      sug('s2', 'Average days in each stage'),
      sug('s3', 'What drives the MQL → SQL drop?'),
    ],
  },

  'salesrep': {
    thinkingMs: [800, 1400],
    blocks: [
      textBlock(
        `**Marcus T. leads the team** with $223K in closed revenue (124% of quota) across 32 deals. Jordan K. is close behind at $202K (112%) with 28 deals — slightly lower volume but higher average deal size. Both are strong candidates for leadership or enterprise expansion roles.\n\n**Priya S. and Elena R. are at risk** — both below quota at 98% and 94% respectively. Priya's deal volume (24) is healthy but deal size may be dragging attainment. Elena has the fewest deals (19) despite being on a mid-tier quota, suggesting pipeline generation issues. Aisha M. exceeded quota at 102% despite the lowest quota — a potential candidate for a higher tier territory.`
      ),
      makeChart('bar', 'Rep Performance vs Quota', 'Full year 2024', 'quota', 'name', 'repPerformance'),
      tableBlock(
        ['Sales Rep', 'Deals Closed', 'Revenue', 'Quota', 'Attainment'],
        [
          ['Marcus T.', '32', '$223,000', '$180,000', '124%'],
          ['Jordan K.', '28', '$202,000', '$180,000', '112%'],
          ['David W.', '21', '$162,000', '$150,000', '108%'],
          ['Aisha M.', '18', '$122,000', '$120,000', '102%'],
          ['Priya S.', '24', '$176,000', '$180,000', '98%'],
          ['Elena R.', '19', '$141,000', '$150,000', '94%'],
        ]
      ),
    ],
    interpretationCard: makeCard(
      [chip('m1', 'metric', 'Attainment %', 'attainment'), chip('d1', 'dimension', 'by Rep', 'rep'), chip('t1', 'time_range', 'Full year 2024', '2024', true)],
      'Attainment % → by Rep → Full year 2024',
      1,
    ),
    trustLayer: tl(
      [
        { name: 'Quota Attainment', definition: 'Closed revenue as a percentage of assigned quota', formula: 'Closed Revenue / Assigned Quota × 100' },
        { name: 'Average Deal Size', definition: 'Total closed revenue divided by number of deals', formula: 'Closed Revenue / Deals Closed' },
      ],
      [{ field: 'Year', operator: 'equals', value: '2024' }],
      { lastUpdated: '2024-12-31T23:59:00Z', range: 'Jan 2024 – Dec 2024', source: 'Salesforce CRM' },
      'Bar chart comparing quota bars against attainment, sorted by performance.',
    ),
    suggestions: [
      sug('s1', 'Show revenue instead of attainment'),
      sug('s2', 'Average deal size by rep'),
      sug('s3', 'Pipeline coverage by rep'),
    ],
  },

  'closedwon': {
    thinkingMs: [1000, 1800],
    blocks: [
      textBlock(
        `You closed **142 deals** worth **$1.03M** in 2024. Q4 was exceptional: 38 deals worth $201K in December alone, driven by holiday budgets and renewed urgency. The average deal size trended upward through the year — from $5,250 in Q1 to $5,290 in Q4.\n\n**December was your best month ever** at $201K across 38 deals, followed by November at $164K (31 deals). This confirms the seasonal pattern: Q4 closes 39% of annual revenue. The August dip ($64K, 12 deals) is a consistent off-season trough — consider adjusting quota targets and pipeline expectations for that period.`
      ),
      makeChart('bar', 'Monthly Closed Deals & Revenue', 'Full year 2024', 'deals', 'name', 'monthlyDeals'),
      tableBlock(
        ['Month', 'Deals', 'Revenue', 'Avg Deal Size'],
        [
          ['Jan', '8', '$42,000', '$5,250'],
          ['Feb', '6', '$31,000', '$5,167'],
          ['Mar', '14', '$72,000', '$5,143'],
          ['Apr', '11', '$58,000', '$5,273'],
          ['May', '18', '$94,000', '$5,222'],
          ['Jun', '16', '$85,000', '$5,313'],
          ['Jul', '15', '$78,000', '$5,200'],
          ['Aug', '12', '$64,000', '$5,333'],
          ['Sep', '21', '$112,000', '$5,333'],
          ['Oct', '24', '$128,000', '$5,333'],
          ['Nov', '31', '$164,000', '$5,290'],
          ['Dec', '38', '$201,000', '$5,290'],
        ]
      ),
    ],
    interpretationCard: makeCard(
      [chip('m1', 'metric', 'Deals Closed', 'deals'), chip('d1', 'dimension', 'by Month', 'month'), chip('t1', 'time_range', 'Full year 2024', '2024', true)],
      'Deals Closed → by Month → Full year 2024',
      1,
    ),
    trustLayer: tl(
      [
        { name: 'Closed Won', definition: 'Opportunities successfully converted to paying customers' },
        { name: 'Average Deal Size', definition: 'Mean contract value of closed-won deals', formula: 'SUM(Closed Revenue) / COUNT(Deals)' },
      ],
      [{ field: 'Year', operator: 'equals', value: '2024' }],
      { lastUpdated: '2024-12-31T23:59:00Z', range: 'Jan 2024 – Dec 2024', source: 'Salesforce CRM' },
      'Bar chart chosen to highlight the strong Q4 seasonal spike and the August trough.',
    ),
    suggestions: [
      sug('s1', 'Show revenue instead of deal count'),
      sug('s2', 'Compare to last year'),
      sug('s3', 'Win rate trend over time'),
    ],
  },

  'default': {
    thinkingMs: [600, 1200],
    blocks: [
      textBlock(
        `I've analyzed your data and here's what stands out: your key metrics are trending positively across all major dimensions. Revenue growth is consistent at 34.2% YoY, user acquisition is accelerating (up 153% from January), and retention rates exceed industry benchmarks.\n\nIf you'd like deeper insights, try asking about specific topics like: **revenue breakdown**, **regional performance**, **user retention**, **conversion channels**, or **product tier analysis**.`
      ),
    ],
    suggestions: [
      sug('s1', 'Revenue trend analysis'),
      sug('s2', 'User growth metrics'),
      sug('s3', 'Sales pipeline overview'),
    ],
  },
};

export function findMatchingResponse(query: string): MockResponse {
  const q = query.toLowerCase();

  if (q.includes('revenue') || q.includes('sales') || q.includes('money') || q.includes('income')) {
    return mockResponses['revenue'];
  }
  if (q.includes('region') || q.includes('country') || q.includes('market') || q.includes('geo')) {
    return mockResponses['regional'];
  }
  if (q.includes('retention') || q.includes('churn') || q.includes('keep') || q.includes('drop')) {
    return mockResponses['retention'];
  }
  if (q.includes('channel') || q.includes('conversion') || q.includes('acquisition') || q.includes('paid') || q.includes('organic')) {
    return mockResponses['channels'];
  }
  if (q.includes('user') || q.includes('customer') || q.includes(' mau ') || q.includes('active')) {
    return mockResponses['users'];
  }
  if (q.includes('product') || q.includes('tier') || q.includes('enterprise') || q.includes('pro') || q.includes('starter')) {
    return mockResponses['product'];
  }
  if (q.includes('marketing') || q.includes('campaign') || q.includes('spend') || q.includes('budget') || q.includes('ads ')) {
    return mockResponses['marketing'];
  }
  if (q.includes('lead') || q.includes('mql') || q.includes('sql') || q.includes('prospect') || q.includes('inbound')) {
    return mockResponses['leads'];
  }
  if (q.includes('email') || q.includes('newsletter') || q.includes('open rate') || q.includes('subscriber') || q.includes('mail')) {
    return mockResponses['email'];
  }
  if (q.includes('pipeline') || q.includes('funnel') || q.includes('stage') || q.includes('opportunity') || q.includes('negotiation')) {
    return mockResponses['pipeline'];
  }
  if (q.includes('sales rep') || q.includes('rep ') || q.includes('quota') || q.includes('attainment') || q.includes('account exec')) {
    return mockResponses['salesrep'];
  }
  if (q.includes('closed won') || q.includes('closed') || q.includes('deal') || q.includes('win rate') || q.includes('wins')) {
    return mockResponses['closedwon'];
  }

  return mockResponses['default'];
}

export const suggestions = [
  'Q1 revenue breakdown by region',
  'User retention analysis this quarter',
  'Which channels drive the most conversions?',
  'Product tier performance comparison',
  'Marketing campaign performance',
  'Sales pipeline overview',
  'Lead source breakdown',
  'Sales rep quota attainment',
];

export const initialConversations = [
  { id: '1', title: 'Q1 revenue analysis', updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) },
  { id: '2', title: 'User retention cohort study', updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000) },
  { id: '3', title: 'Conversion channel breakdown', updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
  { id: '4', title: 'Product tier comparison', updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
  { id: '5', title: 'Marketing campaign performance', updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
  { id: '6', title: 'Sales pipeline analysis', updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
];
